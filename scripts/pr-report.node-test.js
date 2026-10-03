"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const W = require("./workflow-report.js"), R = require("./pr-report.js");
test("warning audits do not block, while selected skipped or unknown checks fail", () => {
  const checks = [{ name: "critical", outcome: "success" }, { name: "high", outcome: "failure", blocking: false }];
  assert.equal(W.manifest("Quality Gate", checks).overall, "PASS");
  assert.equal(W.manifest("Quality Gate", [...checks, { name: "coverage", outcome: "skipped" }]).overall, "FAIL");
  assert.equal(W.normalize({ outcome: "unknown" }).result, "FAIL");
});
test("only genuinely unselected checks become skipped; pending is not success", () => {
  assert.equal(W.normalize({ selected: false, outcome: "failure" }).result, "SKIPPED");
  assert.equal(W.manifest("Quality Gate", [{ outcome: "pending" }]).overall, "PENDING");
  assert.equal(W.manifest("Performance", [{ selected: false }]).overall, "SKIPPED");
});
test("one report combines aggregate state, workflow checks and all metric details", () => {
  const manifest = W.manifest("Quality Gate", [{ name: "high audit", outcome: "failure", blocking: false }]);
  const body = R.render({ number: 3, sha: "abc", state: "FAIL", workflows: [{ name: "Quality Gate", state: "FAIL", manifest, url: "https://github.com/test/repo/actions/runs/1" }], details: ["# Quality Gate\n## Coverage\n80%", "# Performance\n- regression"] });
  assert.equal(body.split(R.MARKER).length, 2); assert.match(body, /\*\*FAIL\*\*/); assert.match(body, /WARNING/); assert.match(body, /No \(warning\)/);
  assert.match(body, /80%/); assert.match(body, /regression/); assert.match(body, /actions\/runs\/1/);
});
test("report sanitizes table values and bounds comment size without losing failure header", () => {
  const body = R.render({ number: 3, sha: "abc", state: "FAIL", workflows: [{ name: "name|@everyone", state: "FAIL" }], details: ["x".repeat(70000)] });
  assert.ok(body.length < 60000); assert.match(body, /\*\*FAIL\*\*/); assert.match(body, /truncated/); assert.match(body, /name\\\|&#64;everyone/);
});
test("report follows the consolidated format with one uninterrupted table for all workflows", () => {
  const workflows = ["PR Quality Gate", "Performance", "Backend CI", "Frontend CI", "E2E"].map((name) => ({
    name, state: "PASS", url: `https://github.com/test/repo/actions/runs/1`,
    manifest: W.manifest(name, [{ name: "Tests", outcome: "success" }]),
  }));
  const body = R.render({ number: 3, sha: "abc", state: "PASS", workflows, details: ["# Quality Gate\n\nCoverage", "# Performance\n\nSpeed"] });
  assert.match(body, /# Quality and performance report/); assert.match(body, /## Workflow checks/);
  assert.match(body, /Quality Gate overall: \*\*PASS\*\*/); assert.match(body, /E2E overall: \*\*PASS\*\*/);
  const table = body.slice(body.indexOf("| Workflow"), body.indexOf("[Quality Gate run]"));
  assert.ok(table.trim().split("\n").every((line) => line.startsWith("|")));
  assert.match(body, /## Quality Gate/); assert.match(body, /## Performance/);
});
