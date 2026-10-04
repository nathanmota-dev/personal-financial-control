#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const C = require("./config.js");
const W = require("./workflow-report.js");
const P = require("./pr-validation.js");

function policyChanges(root, config, review = false) {
  if (!process.env.PR_BASE_SHA || !process.env.PR_HEAD_SHA) return [];
  const established = C.execute(["git", "cat-file", "-e", `${process.env.PR_BASE_SHA}:scripts/quality-gate.config.json`], root);
  if (established.status !== 0) return [];
  const ancestor = C.mergeBase(root, process.env.PR_BASE_SHA, process.env.PR_HEAD_SHA);
  const diff = C.execute(["git", "diff", "--no-renames", "--name-only", ancestor, process.env.PR_HEAD_SHA], root);
  if (diff.status !== 0) throw new C.InputError(`Cannot inspect validation policy: ${diff.stderr}`);
  const files = diff.stdout.trim().split("\n").filter(Boolean);
  const changed = files.filter((file) => {
    if (review) return P.protectedFile(file) && !P.blockingPolicyFile(file, process.env.PR_HEAD_REF);
    if (!P.blockingPolicyFile(file, process.env.PR_HEAD_REF)) return false;
    if (["scripts/baseline.json", "scripts/benchmark-baseline.json", "scripts/benchmark-baseline.local.json"].includes(file)) {
      // Establish a first reviewed CI reference even if the gate was installed on main.
      return C.execute(["git", "cat-file", "-e", `${ancestor}:${file}`], root).status === 0;
    }
    return true;
  });
  if (review) return changed;
  for (const project of config.projects) {
    const file = project.directory === "." ? "package.json" : `${project.directory}/package.json`;
    if (!files.includes(file)) continue;
    const old = C.execute(["git", "show", `${ancestor}:${file}`], root);
    if (old.status !== 0) { changed.push(file); continue; }
    const previous = JSON.parse(old.stdout), current = C.readJson(C.inside(root, file));
    const protectedScripts = ["test:coverage:ci", "benchmark", "benchmark:ci", ...Object.keys(previous.scripts || {}).filter((key) => key.startsWith("quality:"))];
    if (protectedScripts.some((key) => previous.scripts?.[key] !== current.scripts?.[key])) changed.push(`${file} (validation scripts)`);
  }
  return changed;
}
function run(root, config, workflow, options = {}, executor = C.execute) {
  const checks = [];
  const logDirectory = C.inside(root, "reports/logs"); fs.mkdirSync(logDirectory, { recursive: true });
  function step(name, command, directory, blocking = true, selected = true) {
    if (!selected) { checks.push({ name, blocking, selected: false, outcome: "skipped" }); return false; }
    const result = executor(command, C.inside(root, directory));
    const log = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    fs.writeFileSync(path.join(logDirectory, log), result.stdout + result.stderr);
    checks.push({ name, blocking, selected, outcome: result.status === 0 ? "success" : "failure", exitCode: result.status });
    process.stdout.write(`${result.status === 0 ? "PASS" : blocking ? "FAIL" : "WARNING"} ${name}\n`);
    return result.status === 0;
  }
  if (config.mode === "existing") {
    for (const entry of config.validationCommands[workflow]) step(entry.name, entry.command, entry.directory);
    return W.write(root, workflow === "quality" ? "Quality Gate" : "Performance", checks);
  }
  const configFlag = options.config ? ["--config", options.config] : [];
  const node = (file, extra = []) => [process.execPath, path.join(__dirname, file), "--root", root, ...configFlag, ...extra];
  if (workflow === "quality") {
    const changes = policyChanges(root, config);
    const infrastructure = policyChanges(root, config, true);
    if (infrastructure.length) {
      checks.push({ name: "Validation infrastructure review", blocking: false, selected: true, outcome: "warning", details: infrastructure });
      process.stdout.write(`WARNING Validation infrastructure review: ${infrastructure.join(", ")}\n`);
    }
    checks.push({ name: "Validation policy immutability", blocking: true, selected: true, outcome: changes.length ? "failure" : "success", details: changes });
    const policyLog = changes.length ? `FAIL Validation policy immutability: protected validation files changed.\n${changes.map((file) => `- ${file}`).join("\n")}\n` : "PASS Validation policy immutability\n";
    process.stdout.write(policyLog);
    fs.writeFileSync(path.join(logDirectory, "validation-policy-immutability.txt"), policyLog);
    const installs = new Map();
    for (const project of config.projects) {
      const directory = project.installDirectory ?? project.directory;
      if (!installs.has(directory)) installs.set(directory, step(`${directory} npm ci`, ["npm", "ci"], directory));
      const installed = installs.get(directory);
      if (installed) {
        step(`${project.name} critical audit`, ["npm", "audit", "--audit-level=critical"], directory);
        step(`${project.name} high audit`, ["npm", "audit", "--audit-level=high"], directory, false);
      } else for (const name of ["critical audit", "high audit"]) checks.push({ name: `${project.name} ${name}`, selected: true, blocking: name !== "high audit", outcome: "skipped" });
      for (const key of ["build", "lint", "typecheck", "coverage", "integration", "e2e"]) {
        const command = project.commands[key];
        if (!command) { checks.push({ name: `${project.name} ${key}`, selected: false, blocking: false, outcome: "skipped" }); continue; }
        if (key === "coverage") fs.rmSync(C.inside(root, project.coveragePath), { force: true });
        if (installed && key === "e2e") {
          const browserCommand = [...(project.commands.browserSetup || ["npm", "exec", "--no", "--", "playwright", "install", "chromium"])];
          if (process.env.CI === "true") browserCommand.splice(browserCommand.indexOf("install") + 1, 0, "--with-deps");
          const browserReady = step(`${project.name} Playwright browser`, browserCommand, project.directory);
          if (!browserReady) { checks.push({ name: `${project.name} e2e`, selected: true, blocking: true, outcome: "skipped" }); continue; }
        }
        if (installed) step(`${project.name} ${key}`, command, project.directory);
        else checks.push({ name: `${project.name} ${key}`, selected: true, blocking: true, outcome: "skipped" });
        if (key === "coverage" && fs.existsSync(C.inside(root, project.coveragePath))) {
          const output = C.inside(root, `reports/coverage/${project.name}`), input = C.inside(root, project.coveragePath);
          fs.mkdirSync(output, { recursive: true });
          const folder = path.dirname(input);
          if (path.basename(folder) === "coverage") fs.cpSync(folder, output, { recursive: true });
          else if (input !== path.join(output, "coverage-summary.json")) fs.copyFileSync(input, path.join(output, "coverage-summary.json"));
        }
        if (key === "e2e") for (const folder of ["test-results", "playwright-report"]) {
          const input = C.inside(root, `${project.directory}/${folder}`);
          if (fs.existsSync(input)) fs.cpSync(input, C.inside(root, `reports/e2e/${project.name}/${folder}`), { recursive: true });
        }
      }
    }
    step("Gate and reporter tests", [process.execPath, "--test", ...fs.readdirSync(__dirname).filter((file) => file.endsWith(".node-test.js")).map((file) => path.join(__dirname, file))], ".");
    for (const file of ["quality-gate.md", "quality-gate.json", "candidate-baseline.json"]) fs.rmSync(C.inside(root, `reports/${file}`), { force: true });
    const bootstrap = process.env.QUALITY_GATE_BOOTSTRAP === "true" || !fs.existsSync(path.resolve(root, process.env.QUALITY_GATE_BASELINE_PATH || "scripts/baseline.json"));
    step("Quality metric comparison", node("quality-gate.js", bootstrap ? ["--bootstrap"] : []), ".");
  } else if (workflow === "performance") {
    if (process.env.CI === "true") {
      step("Paired benchmark and reporter tests", [process.execPath, "--test", path.join(__dirname, "benchmark-gate.node-test.js"), path.join(__dirname, "paired-benchmarks.node-test.js")], ".");
      step("Same-runner paired benchmark comparison", node("paired-benchmarks.js", options.projects === undefined ? [] : ["--projects", options.projects]), ".");
      return W.write(root, "Performance", checks);
    }
    const bootstrap = process.env.BENCHMARK_BOOTSTRAP === "true" || !fs.existsSync(path.resolve(root, C.benchmarkBaselinePath(config)));
    let selected = options.projects === undefined ? config.projects.map((p) => p.name) : options.projects.split(",").filter(Boolean);
    if (bootstrap) selected = config.projects.map((p) => p.name);
    if (selected.some((name) => !config.projects.some((p) => p.name === name))) throw new C.InputError("Unknown benchmark project.");
    const installs = new Map();
    for (const project of config.projects) {
      const chosen = selected.includes(project.name), directory = project.installDirectory ?? project.directory;
      if (chosen && !installs.has(directory)) installs.set(directory, step(`${directory} npm ci`, ["npm", "ci"], directory));
      if (chosen) {
        fs.mkdirSync(path.dirname(C.inside(root, project.benchmarkPath)), { recursive: true });
        fs.rmSync(C.inside(root, project.benchmarkPath), { force: true });
      }
      if (!chosen || installs.get(directory)) step(`${project.name} microbenchmarks`, project.commands.benchmark, project.directory, true, chosen);
      else checks.push({ name: `${project.name} microbenchmarks`, selected: true, blocking: true, outcome: "skipped" });
    }
    step("Benchmark gate tests", [process.execPath, "--test", path.join(__dirname, "benchmark-gate.node-test.js")], ".");
    for (const file of ["performance.md", "performance.json", "benchmark-candidate-baseline.json"]) fs.rmSync(C.inside(root, `reports/${file}`), { force: true });
    step("Benchmark comparison", node("benchmark-gate.js", ["--projects", selected.join(","), ...bootstrap ? ["--bootstrap"] : []]), ".");
  } else if (["backend", "frontend", "e2e"].includes(workflow) && config.ci?.workflows?.[workflow]) {
    let installed = true;
    for (const entry of config.ci.workflows[workflow]) {
      if (!installed) {
        checks.push({ name: entry.name, selected: true, blocking: entry.blocking !== false, outcome: "skipped" });
        continue;
      }
      const command = process.env.CI === "true" && entry.ciCommand ? entry.ciCommand : entry.command;
      const passed = step(entry.name, command, ".", entry.blocking !== false);
      if (entry.command[0] === "npm" && entry.command[1] === "ci") installed = passed;
    }
    if (workflow === "e2e") for (const folder of ["test-results", "playwright-report"]) {
      const input = C.inside(root, folder);
      if (fs.existsSync(input)) fs.cpSync(input, C.inside(root, `reports/e2e/${folder}`), { recursive: true });
    }
  } else throw new C.InputError(`Unknown workflow: ${workflow}`);
  return W.write(root, P.workflowDefinition(workflow).displayName, checks);
}
function runCli(args = process.argv.slice(2)) {
  let root = process.cwd(), workflow = "quality";
  try {
    const options = C.argumentsFor(args, ["--workflow"]); root = options.root; workflow = options.workflow || "quality";
    const raw = C.readJson(options.config ? path.resolve(root, options.config) : C.inside(root, "scripts/quality-gate.config.json"));
    const config = raw.mode === "existing" ? raw : C.loadConfig(options);
    const result = run(root, config, workflow, options);
    return result.overall === "PASS" ? 0 : 1;
  } catch (error) {
    W.write(root, P.workflowDefinition(workflow)?.displayName || "Quality Gate", [{ name: "Workflow input", outcome: "failure", blocking: true, selected: true, details: [error.message] }]);
    process.stderr.write(error.message + "\n"); return 2;
  }
}
module.exports = { policyChanges, run, runCli };
if (require.main === module) process.exitCode = runCli();
