"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const Runner = require("./run-checks.js"), H = require("./test-helpers.js");
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
  const root = H.temporary(t), config = H.config([H.project("backend", "backend"), H.project("frontend", "frontend")]), seen = [];
  const result = Runner.run(root, config, "performance", { projects: "" }, (command, cwd) => { seen.push({ command, cwd }); return { status: 0, stdout: "", stderr: "" }; });
  assert.equal(result.overall, "PASS"); assert.deepEqual(result.checks.filter((check) => check.name.endsWith("microbenchmarks")).map((check) => check.selected), [true, true]);
  assert.equal(seen.filter((item) => item.command.includes("benchmark")).length, 2);
});
test("workspace dependency installation is deduplicated and raw benchmark files are cleared", (t) => {
  const root = H.temporary(t), config = H.config([H.project("backend", "backend"), H.project("frontend", "frontend")]), seen = [];
  config.projects.forEach((p) => { p.installDirectory = "."; H.write(root, p.benchmarkPath, "stale"); });
  Runner.run(root, config, "performance", {}, (command) => { seen.push(command); return { status: 0, stdout: "", stderr: "" }; });
  assert.equal(seen.filter((command) => command[1] === "ci").length, 1);
  assert.equal(fs.existsSync(path.join(root, config.projects[0].benchmarkPath)), false);
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
