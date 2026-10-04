"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const Runner = require("./run-checks.js"), H = require("./test-helpers.js");
const C = require("./config.js");
function localPerformance(t) {
  const previous = process.env.CI; process.env.CI = "false";
  t.after(() => { if (previous === undefined) delete process.env.CI; else process.env.CI = previous; });
}
test("high audit failure remains a warning while required coverage failures block", (t) => {
  const root = H.temporary(t), config = H.config();
  const execute = (command) => ({ status: command.includes("--audit-level=high") ? 1 : 0, stdout: "", stderr: "" });
  const passed = Runner.run(root, config, "quality", {}, execute);
  assert.equal(passed.overall, "PASS"); assert.equal(passed.checks.find((c) => c.name.includes("high audit")).result, "WARNING");
  const failed = Runner.run(root, config, "quality", {}, (command) => ({ status: command.includes("test:coverage:ci") ? 1 : 0, stdout: "", stderr: "" }));
  assert.equal(failed.overall, "FAIL");
});
test("failed installation does not execute package commands and selected skips fail", (t) => {
  const root = H.temporary(t), seen = [];
  const result = Runner.run(root, H.config(), "quality", {}, (command) => { seen.push(command); return { status: command[1] === "ci" ? 1 : 0, stdout: "", stderr: "" }; });
  assert.equal(result.overall, "FAIL"); assert.ok(!seen.some((command) => command.includes("lint")));
  assert.equal(result.checks.find((check) => check.name === "app coverage").result, "FAIL");
});
test("benchmark bootstrap measures all projects sequentially despite an empty selection", (t) => {
  localPerformance(t);
  const root = H.temporary(t), config = H.config([H.project("backend", "backend"), H.project("frontend", "frontend")]), seen = [];
  const result = Runner.run(root, config, "performance", { projects: "" }, (command, cwd) => { seen.push({ command, cwd }); return { status: 0, stdout: "", stderr: "" }; });
  assert.equal(result.overall, "PASS"); assert.deepEqual(result.checks.filter((check) => check.name.endsWith("microbenchmarks")).map((check) => check.selected), [true, true]);
  assert.equal(seen.filter((item) => item.command.includes("benchmark")).length, 2);
});
test("workspace dependency installation is deduplicated and raw benchmark files are cleared", (t) => {
  localPerformance(t);
  const root = H.temporary(t), config = H.config([H.project("backend", "backend"), H.project("frontend", "frontend")]), seen = [];
  config.projects.forEach((p) => { p.installDirectory = "."; H.write(root, p.benchmarkPath, "stale"); });
  Runner.run(root, config, "performance", {}, (command) => { seen.push(command); return { status: 0, stdout: "", stderr: "" }; });
  assert.equal(seen.filter((command) => command[1] === "ci").length, 1);
  assert.equal(fs.existsSync(path.join(root, config.projects[0].benchmarkPath)), false);
});
test("CI performance requires paired measurement and never bootstraps an absent reference", (t) => {
  const previous = process.env.CI; process.env.CI = "true";
  t.after(() => { if (previous === undefined) delete process.env.CI; else process.env.CI = previous; });
  const root = H.temporary(t), seen = [];
  const result = Runner.run(root, H.config(), "performance", {}, (command) => {
    seen.push(command); return { status: command.some((part) => part.endsWith("paired-benchmarks.js")) ? 2 : 0, stdout: "", stderr: "Required CI reference missing" };
  });
  assert.equal(result.overall, "FAIL");
  assert.ok(seen.some((command) => command.some((part) => part.endsWith("paired-benchmarks.js"))));
  assert.ok(!seen.some((command) => command.includes("--bootstrap")));
});
test("browser setup failure blocks an existing E2E suite rather than skipping green", (t) => {
  const root = H.temporary(t), config = H.config(); config.projects[0].commands.e2e = ["npm", "run", "test:e2e"];
  const result = Runner.run(root, config, "quality", {}, (command) => ({ status: command.includes("playwright") ? 1 : 0, stdout: "", stderr: "" }));
  assert.equal(result.overall, "FAIL"); assert.equal(result.checks.find((check) => check.name === "app e2e").result, "FAIL");
});
test("registered frontend/backend workflows expose every check and preserve warning audits", (t) => {
  const root = H.temporary(t), config = H.config();
  config.ci = { workflows: { backend: [
    { name: "npm ci", command: ["npm", "ci"] },
    { name: "High audit", command: ["npm", "audit"], blocking: false },
    { name: "Backend tests", command: ["npm", "run", "test:backend"] },
  ] } };
  const result = Runner.run(root, config, "backend", {}, (command) => ({ status: command.includes("audit") ? 1 : 0, stdout: "", stderr: "" }));
  assert.equal(result.overall, "PASS"); assert.equal(result.checks[1].result, "WARNING");
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, "reports/backend-workflow.json"))).workflow, "Backend CI");
  const failed = Runner.run(root, config, "backend", {}, () => ({ status: 1, stdout: "", stderr: "" }));
  assert.equal(failed.overall, "FAIL"); assert.equal(failed.checks[2].outcome, "skipped");
});
test("quality runner installs the configured Playwright browser instead of choosing a different one", (t) => {
  const root = H.temporary(t), config = H.config(), seen = [];
  config.projects[0].commands.e2e = ["npm", "run", "test:e2e"];
  config.projects[0].commands.browserSetup = ["npm", "exec", "--no", "--", "playwright", "install", "firefox"];
  Runner.run(root, config, "quality", {}, (command) => { seen.push(command); return { status: 0, stdout: "", stderr: "" }; });
  assert.ok(seen.some((command) => command.includes("firefox")));
  assert.ok(!seen.some((command) => command.includes("chromium")));
});
test("policy and package selection compare the merge base and ignore baseline updates exclusive to main", (t) => {
  const root = H.temporary(t);
  function git(...args) { const result = C.execute(["git", ...args], root); assert.equal(result.status, 0, result.stderr); return result.stdout.trim(); }
  git("init", "-b", "main"); git("config", "user.email", "test@example.test"); git("config", "user.name", "Test");
  H.write(root, "scripts/quality-gate.config.json", H.config()); H.write(root, "scripts/baseline.json", {});
  H.write(root, "package.json", { scripts: { "test:coverage:ci": "coverage" } });
  git("add", "."); git("commit", "-m", "base"); const ancestor = git("rev-parse", "HEAD");
  git("switch", "-c", "feature"); H.write(root, "README.md", "PR documentation only");
  git("add", "."); git("commit", "-m", "feature"); const head = git("rev-parse", "HEAD");
  git("switch", "main"); H.write(root, "scripts/baseline.json", { improved: true });
  H.write(root, "package.json", { scripts: { "test:coverage:ci": "updated on main" } });
  git("add", "."); git("commit", "-m", "baseline"); const base = git("rev-parse", "HEAD"); git("switch", "feature");
  const previous = { PR_BASE_SHA: process.env.PR_BASE_SHA, PR_HEAD_SHA: process.env.PR_HEAD_SHA };
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  process.env.PR_BASE_SHA = base; process.env.PR_HEAD_SHA = head;
  assert.equal(C.mergeBase(root, base, head), ancestor);
  assert.deepEqual(Runner.policyChanges(root, H.config()), []);
  const selection = C.execute([process.execPath, path.join(__dirname, "select-projects.js"), "--root", root], root);
  assert.equal(selection.status, 0); assert.equal(selection.stdout.trim(), "projects=");
  H.write(root, "scripts/baseline.json", { changedByPR: true }); git("add", "."); git("commit", "-m", "protected");
  process.env.PR_HEAD_SHA = git("rev-parse", "HEAD");
  assert.deepEqual(Runner.policyChanges(root, H.config()), ["scripts/baseline.json"]);
  const result = Runner.run(root, H.config(), "quality", {}, () => ({ status: 0, stdout: "", stderr: "" }));
  assert.equal(result.overall, "FAIL");
  assert.match(fs.readFileSync(path.join(root, "reports/quality-workflow.md"), "utf8"), /Validation policy immutability — FAIL[\s\S]*scripts\/baseline.json/);
  assert.match(fs.readFileSync(path.join(root, "reports/logs/validation-policy-immutability.txt"), "utf8"), /protected validation files changed[\s\S]*scripts\/baseline.json/);
});
