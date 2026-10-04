#!/usr/bin/env node
"use strict";
const fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const C = require("./config.js"), B = require("./benchmark-gate.js");

function median(values) {
  if (values.length !== 3) throw new C.InputError("Exactly three benchmark measurements are required.");
  values.forEach((value) => C.finite(value, "throughput", true));
  return [...values].sort((a, b) => a - b)[1];
}
function aggregateRuns(runs, tracked, names) {
  if (runs.length !== 3) throw new C.InputError("Exactly three complete benchmark pairs are required.");
  const projects = {};
  for (const name of names) {
    const measurements = runs.map((run) => run.projects?.[name]?.benchmarks);
    if (measurements.some((items) => !items)) throw new C.InputError(`Missing benchmark project: ${name}`);
    const keys = Object.keys(measurements[0]).sort();
    if (measurements.some((items) => Object.keys(items).sort().join() !== keys.join())) throw new C.InputError(`Inconsistent benchmark scenarios: ${name}`);
    for (const key of Object.keys(tracked.projects[name].benchmarks)) {
      if (!keys.includes(key)) throw new C.InputError(`Required benchmark is missing: ${name}/${key}`);
    }
    projects[name] = { benchmarks: Object.fromEntries(keys.map((key) => {
      const samples = measurements.map((items) => B.statistics(items[key], `${name}/${key}`));
      const hz = median(samples.map((sample) => sample.hz));
      return [key, { ...samples.find((sample) => sample.hz === hz), hz, measurements: samples }];
    })) };
  }
  return { projects };
}
function resolveCommit(root, sha, execute = C.execute) {
  if (!/^[a-f0-9]{40}$/.test(sha || "")) throw new C.InputError("Benchmark reference requires a full commit SHA.");
  const result = execute(["git", "rev-parse", "--verify", `${sha}^{commit}`], root);
  if (result.status !== 0 || result.stdout.trim() !== sha) throw new C.InputError(`Invalid benchmark commit reference: ${sha}`);
  return sha;
}
function run(root, config, baseline, selected, execute = C.execute) {
  const names = config.projects.map((project) => project.name);
  B.validateBaseline(baseline, names);
  if (selected.some((name) => !names.includes(name))) throw new C.InputError("Unknown selected benchmark project.");
  const referenceSha = resolveCommit(root, baseline.headSha, execute);
  const headSha = resolveCommit(root, C.provenance().headSha, execute);
  if (execute(["git", "merge-base", "--is-ancestor", referenceSha, headSha], root).status !== 0) throw new C.InputError("Benchmark reference is not an ancestor of the measured commit.");
  const inputDiff = execute(["git", "diff", "--name-only", referenceSha, headSha, "--", "benchmarks", "vitest.benchmark.config.*"], root);
  if (inputDiff.status !== 0 || inputDiff.stdout.trim()) throw new C.InputError("Protected benchmark inputs/configuration differ from the reference.");
  const runner = { ...B.runnerIdentity(), name: process.env.RUNNER_NAME || "unknown", image: process.env.ImageOS || "unknown" };
  const runtime = { node: process.version, platform: process.platform, arch: process.arch };
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "pfc-paired-benchmarks-"));
  const sides = ["reference", "current"], roots = Object.fromEntries(sides.map((side) => [side, path.join(temporary, side)]));
  const created = [], runs = { reference: [], current: [] };
  function command(args, cwd, label) {
    const result = execute(args, cwd);
    const log = C.inside(root, `reports/logs/paired-${label}.txt`);
    fs.mkdirSync(path.dirname(log), { recursive: true });
    fs.writeFileSync(log, result.stdout + result.stderr);
    if (result.status !== 0) throw new C.InputError(`${label} failed; inspect ${C.relative(root, log)}.`);
    return result;
  }
  try {
    if (selected.length) {
      for (const side of sides) {
        command(["git", "worktree", "add", "--detach", roots[side], side === "reference" ? referenceSha : headSha], root, `checkout-${side}`);
        created.push(side);
        const directories = new Set(config.projects.filter((project) => selected.includes(project.name)).map((project) => project.installDirectory ?? project.directory));
        for (const [index, directory] of [...directories].entries()) command(["npm", "ci"], C.inside(roots[side], directory), `install-${side}-${index}`);
      }
      for (let pair = 1; pair <= 3; pair++) for (const side of sides) {
        const projects = {};
        for (const project of config.projects.filter((item) => selected.includes(item.name))) {
          const rawPath = C.inside(roots[side], project.benchmarkPath);
          fs.mkdirSync(path.dirname(rawPath), { recursive: true });
          fs.rmSync(rawPath, { force: true });
          command(project.commands.benchmark, C.inside(roots[side], project.directory), `${pair}-${side}-${project.name}`);
          projects[project.name] = B.extract(C.readJson(rawPath), project.name);
          const artifact = C.inside(root, `reports/benchmarks/paired/${pair}-${side}-${project.name}.json`);
          fs.mkdirSync(path.dirname(artifact), { recursive: true }); fs.copyFileSync(rawPath, artifact);
        }
        runs[side].push({ pair, commit: side === "reference" ? referenceSha : headSha, runner, runtime, ...C.provenance(), projects });
      }
    }
    const reference = { ...baseline, ...(selected.length ? aggregateRuns(runs.reference, baseline, selected) : { projects: {} }), headSha: referenceSha, runner, runtime };
    const current = { schemaVersion: 1, policy: { maxRegressionPercent: 20 }, ...(selected.length ? aggregateRuns(runs.current, baseline, selected) : { projects: {} }), runner, runtime, ...C.provenance() };
    const comparison = B.compare(reference, current, selected);
    const evidence = { referenceSha, headSha, pairs: selected.length ? 3 : 0, aggregation: "median throughput per scenario", runner, runtime, ...C.provenance(), runs };
    const report = { schemaVersion: 1, status: comparison.passed ? "pass" : "fail", comparison, reference, current, evidence, baseline: referenceSha, ...C.provenance() };
    C.writeJson(C.inside(root, "reports/performance.json"), report);
    C.writeJson(C.inside(root, "reports/benchmark-candidate-baseline.json"), { ...current, projects: { ...baseline.projects, ...current.projects } });
    const rows = sides.flatMap((side) => runs[side].flatMap((run) => Object.entries(run.projects).flatMap(([name, project]) => Object.entries(project.benchmarks).map(([key, value]) => `| ${run.pair} | ${side} | ${C.escape(name + "/" + key)} | ${value.hz.toFixed(2)} | ${value.rme.toFixed(2)}% | ${value.sampleCount} |`))));
    const measurementLabel = selected.length ? "Three sequential pairs; median throughput per scenario." : "No packages selected; benchmarks skipped.";
    const markdown = B.render(reference, comparison, selected, names, referenceSha) + `\n## Paired measurement evidence\n\nReference commit: \`${referenceSha}\`. Current commit: \`${headSha}\`.\nRunner: ${C.escape(JSON.stringify(runner))}. Runtime: ${C.escape(process.version)}.\nRun: ${C.escape(C.provenance().runId)}; attempt: ${C.escape(C.provenance().runAttempt)}. ${measurementLabel}\n\n| Pair | Checkout | Scenario | ops/s | RME | Samples |\n|---|---|---|---:|---:|---:|\n${rows.join("\n")}\n`;
    fs.writeFileSync(C.inside(root, "reports/performance.md"), markdown);
    process.stdout.write(markdown);
    return comparison.passed ? 0 : 1;
  } finally {
    for (const side of created) execute(["git", "worktree", "remove", "--force", roots[side]], root);
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
function runCli(args = process.argv.slice(2)) {
  let root = process.cwd();
  try {
    const options = C.argumentsFor(args); root = options.root;
    const config = C.loadConfig(options), names = config.projects.map((project) => project.name);
    const baseline = C.readJson(path.resolve(root, options.baseline || C.benchmarkBaselinePath(config)));
    const selected = options.projects === undefined ? names : [...new Set(options.projects.split(",").filter(Boolean))];
    for (const file of ["performance.json", "performance.md", "benchmark-candidate-baseline.json"]) fs.rmSync(C.inside(root, `reports/${file}`), { force: true });
    return run(root, config, baseline, selected);
  } catch (error) { C.failureReport(root, "performance", error); process.stderr.write(error.message + "\n"); return 2; }
}
module.exports = { median, aggregateRuns, resolveCommit, run, runCli };
if (require.main === module) process.exitCode = runCli();
