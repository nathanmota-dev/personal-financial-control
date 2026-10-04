#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const C = require("./config.js"), Q = require("./quality-gate.js"), B = require("./benchmark-gate.js"), W = require("./workflow-report.js");

function qualityEligibility(baseline, candidate, config) {
  Q.validateBaseline(baseline, config); Q.validateBaseline(candidate, config);
  const current = { ...candidate, coverage: Q.aggregate(candidate.projects) };
  const comparison = Q.compare(baseline, current, config.qualityMode);
  const reasons = [...comparison.failures];
  let improved = false;
  const coverage = (old, value) => {
    for (const metric of C.METRICS) improved ||= C.lower(old[metric], value[metric]);
  };
  const duplication = (old, value) => {
    improved ||= value.fragments < old.fragments || value.duplicatedLines * old.totalLines < old.duplicatedLines * value.totalLines;
  };
  coverage(Q.aggregate(baseline.projects), current.coverage);
  duplication(baseline.duplication, current.duplication);
  for (const [name, project] of Object.entries(candidate.projects)) {
    const old = baseline.projects[name];
    coverage(old.coverage, project.coverage); duplication(old.duplication, project.duplication);
    for (const [file, lines] of Object.entries(old.files)) {
      if (project.files[file] > lines) reasons.push(`${file}: size increased; reference cannot advance.`);
      if (project.files[file] === undefined || project.files[file] < lines) improved = true;
    }
    const sizes = Q.functionSizes(project);
    for (const [key, fn] of Q.functionSizes(old)) {
      if (sizes.get(key)?.lines > fn.lines) reasons.push(`${fn.file} ${fn.name}: function size increased; reference cannot advance.`);
      if (!sizes.has(key) || sizes.get(key).lines < fn.lines) improved = true;
    }
  }
  if (!improved) reasons.push("No protected quality metric improved.");
  return { eligible: !reasons.length, reasons };
}
function performanceEligibility(baseline, candidate, report, names, sha) {
  B.validateBaseline(baseline, names); B.validateBaseline(candidate, names);
  const evidence = report.evidence;
  if (!evidence || evidence.headSha !== sha || evidence.referenceSha !== baseline.headSha || evidence.pairs !== 3) throw new C.InputError("Invalid paired performance promotion evidence.");
  const reference = require("./paired-benchmarks.js").aggregateRuns(evidence.runs?.reference || [], baseline, names);
  const current = require("./paired-benchmarks.js").aggregateRuns(evidence.runs?.current || [], baseline, names);
  for (const side of ["reference", "current"]) for (const [index, run] of evidence.runs[side].entries()) {
    if (run.pair !== index + 1) throw new C.InputError("Paired measurements must contain pairs 1, 2 and 3 in order.");
    if (run.commit !== (side === "reference" ? baseline.headSha : sha) || run.headSha !== sha ||
      String(run.runId) !== String(report.runId) || String(run.runAttempt) !== String(report.runAttempt) ||
      !require("node:util").isDeepStrictEqual(run.runner, evidence.runner) ||
      !require("node:util").isDeepStrictEqual(run.runtime, evidence.runtime)) throw new C.InputError("Paired measurements do not share commits, runner, runtime and attempt.");
  }
  const reasons = []; let improved = false;
  for (const name of names) {
    const old = reference.projects[name].benchmarks, value = current.projects[name].benchmarks;
    // Newly added scenarios still need an explicit reviewed reference.
    if (Object.keys(old).sort().join() !== Object.keys(baseline.projects[name].benchmarks).sort().join() ||
      Object.keys(value).sort().join() !== Object.keys(old).sort().join()) reasons.push(`${name}: scenario set changed; review required.`);
    for (const [key, previous] of Object.entries(old)) {
      if (!value[key] || value[key].hz < previous.hz) reasons.push(`${name}/${key}: throughput decreased; reference cannot advance.`);
      if (value[key]?.hz > previous.hz) improved = true;
    }
    for (const [key, measured] of Object.entries(value)) {
      if (candidate.projects[name].benchmarks[key]?.hz !== measured.hz) throw new C.InputError("Candidate throughput differs from paired measurements.");
    }
  }
  if (!improved) reasons.push("No protected performance scenario improved.");
  return { eligible: !reasons.length, reasons };
}
function evidence(root, kind, sha) {
  const manifest = C.readJson(C.inside(root, `reports/${kind}-workflow.json`));
  const metric = C.readJson(C.inside(root, `reports/${kind === "quality" ? "quality-gate" : "performance"}.json`));
  for (const value of [manifest, metric]) {
    if (value.schemaVersion !== 1 || value.headSha !== sha || String(value.runId) !== C.provenance().runId || String(value.runAttempt) !== C.provenance().runAttempt) throw new C.InputError("Promotion report provenance mismatch.");
  }
  if (manifest.overall !== "PASS" || W.overall(manifest.checks.map(W.normalize)) !== "PASS" || metric.status !== "pass") throw new C.InputError("Integrated commit validation failed; promotion disabled.");
  return metric;
}
function promote(root, config, sha, execute = C.execute) {
  require("./paired-benchmarks.js").resolveCommit(root, sha, execute);
  if (execute(["git", "rev-parse", "HEAD"], root).stdout.trim() !== sha || execute(["git", "status", "--porcelain", "--untracked-files=no"], root).stdout.trim()) throw new C.InputError("Promotion requires a clean checkout of the integrated commit.");
  evidence(root, "quality", sha);
  const performance = evidence(root, "performance", sha);
  const qualityCandidate = C.readJson(C.inside(root, "reports/candidate-baseline.json"));
  const performanceCandidate = C.readJson(C.inside(root, "reports/benchmark-candidate-baseline.json"));
  for (const candidate of [qualityCandidate, performanceCandidate]) if (candidate.headSha !== sha || String(candidate.runId) !== C.provenance().runId || String(candidate.runAttempt) !== C.provenance().runAttempt) throw new C.InputError("Candidate provenance mismatch.");
  const decisions = {
    "scripts/baseline.json": qualityEligibility(C.readJson(C.inside(root, "scripts/baseline.json")), qualityCandidate, config),
    "scripts/benchmark-baseline.json": performanceEligibility(C.readJson(C.inside(root, "scripts/benchmark-baseline.json")), performanceCandidate, performance, config.projects.map((project) => project.name), sha),
  };
  const files = Object.keys(decisions).filter((file) => decisions[file].eligible);
  function command(args) {
    const result = execute(args, root);
    if (result.status !== 0) throw new C.InputError(`Promotion command failed: ${args.slice(0, 3).join(" ")}: ${result.stderr}`);
    return result;
  }
  command(["git", "fetch", "origin", "main"]);
  if (command(["git", "rev-parse", "origin/main"]).stdout.trim() !== sha) return { status: "discarded", reason: "main advanced during validation", files: [], decisions };
  if (!files.length) return { status: "unchanged", files, decisions };
  for (const file of files) {
    const candidate = file === "scripts/baseline.json" ? qualityCandidate : performanceCandidate;
    C.writeJson(C.inside(root, file), { ...candidate, source: { commit: sha, runId: C.provenance().runId, runAttempt: C.provenance().runAttempt, promotion: "strict improvements only" } });
  }
  command(["git", "add", "--", ...files]);
  command(["git", "-c", "user.name=github-actions[bot]", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com", "commit", "-m", "ci: update improved baselines", "-m", "[baseline-promotion]"]);
  const push = execute(["git", "push", "origin", "HEAD:refs/heads/main"], root);
  if (push.status !== 0) {
    command(["git", "fetch", "origin", "main"]);
    if (command(["git", "rev-parse", "origin/main"]).stdout.trim() !== sha) return { status: "discarded", reason: "main advanced before push; no force push attempted", files: [], decisions };
    throw new C.InputError(`Baseline push rejected: ${push.stderr}`);
  }
  return { status: "promoted", files, decisions };
}
function runCli(args = process.argv.slice(2)) {
  try {
    const options = C.argumentsFor(args), config = C.loadConfig(options);
    if (process.env.CI !== "true" || process.env.GITHUB_REF !== "refs/heads/main") throw new C.InputError("Automatic promotion only runs on main in CI.");
    const result = promote(options.root, config, process.env.GITHUB_SHA);
    C.writeJson(C.inside(options.root, "reports/baseline-promotion.json"), result);
    const markdown = `# Baseline promotion\n\n**${result.status.toUpperCase()}**${result.reason ? ` — ${result.reason}` : ""}\n\n` + Object.entries(result.decisions).map(([file, decision]) => `- ${file}: ${decision.eligible ? "eligible improvement" : decision.reasons.map(C.escape).join("; ")}`).join("\n") + "\n";
    fs.writeFileSync(C.inside(options.root, "reports/baseline-promotion.md"), markdown);
    process.stdout.write(markdown);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
    return 0;
  } catch (error) { process.stderr.write(error.message + "\n"); return 2; }
}
module.exports = { qualityEligibility, performanceEligibility, evidence, promote, runCli };
if (require.main === module) process.exitCode = runCli();
