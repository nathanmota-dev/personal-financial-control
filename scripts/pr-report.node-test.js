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
  assert.match(body, /80%/); assert.match(body, /regression/); assert.doesNotMatch(body, /actions\/runs\/1/);
});
test("report sanitizes table values and bounds comment size without losing workflow failures", () => {
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
  const table = body.slice(body.indexOf("| Workflow"), body.indexOf("## Quality Gate"));
  assert.ok(table.trim().split("\n").every((line) => line.startsWith("|")));
  assert.match(body, /## Quality Gate/); assert.match(body, /## Performance/);
  assert.doesNotMatch(body, /PR #3|commit `abc`|metric comparison:|\[(Quality Gate|Performance|Backend CI|Frontend CI|E2E) run\]/);
});

test("comment omits infrastructure and measurement metadata while preserving tables and failures", () => {
  const quality = ["# Quality Gate", "**FAIL** — Blocking quality checks failed.",
    "This is the metric comparison result. Required command outcomes and protected-file violations determine the overall workflow result.",
    "Existing coverage and size debt is accepted only at the reviewed reference; regressions and new size violations block.",
    "Baseline: `base&#64;reference:scripts/baseline.json`", "## Coverage", "| lines | 80% | 79% | -1 pp |",
    "## Maintainability", "| ESLint violations | 0 | 0 | +0 |", "## Failures", "- app: lines coverage decreased.",
    "## Existing debt (warning only)", "- app: branches coverage below 80% target."].join("\n\n");
  const performance = ["# Performance", "**PASS** — Throughput loss greater than 20% blocks delivery.",
    "This is the metric comparison result. Required command outcomes determine the overall workflow result.",
    "Baseline: `reference-sha` · limit: 20% throughput loss.", "| app | finance scenario | 100 | 101 | PASS |",
    "## Paired measurement evidence", "Reference commit: `reference-sha`. Current commit: `current-sha`.\nRunner: {\"cpuModel\":\"private-runner\"}. Runtime: v24.21.0.\nRun: 123; attempt: 1. Three sequential pairs; median throughput per scenario.",
    "| Pair | Checkout | Scenario | ops/s | RME | Samples |", "| 1 | current | app/scenario | 101 | 1% | 100 |"].join("\n\n");
  const infrastructure = "## Validation infrastructure review\n\n**WARNING** — CI maintenance paths changed: scripts/pr-report.js. Policy inputs remain protected.";
  const workflows = [{ name: "Quality Gate", state: "FAIL", manifest: W.manifest("Quality Gate", [
    { name: "Validation infrastructure review", outcome: "warning", blocking: false, details: ["scripts/pr-report.js"] },
    { name: "Critical audit", outcome: "failure", details: ["critical vulnerability"] },
  ]) }];
  const body = R.render({ workflows, details: [infrastructure, quality, performance] });
  assert.doesNotMatch(body, /CI maintenance paths changed|## Validation infrastructure review|### Quality Gate: Validation infrastructure review|scripts\/pr-report\.js/);
  assert.doesNotMatch(body, /This is the metric comparison result|Existing coverage and size debt|Baseline:|Reference commit:|Current commit:|Runner:|Runtime:|Run: 123|reference-sha|current-sha|private-runner/);
  for (const value of ["## Coverage", "## Maintainability", "| lines | 80% | 79% | -1 pp |", "| app | finance scenario | 100 | 101 | PASS |", "| 1 | current | app/scenario | 101 | 1% | 100 |", "lines coverage decreased", "branches coverage below 80% target", "critical vulnerability", "| Quality Gate | Validation infrastructure review | WARNING |"])
    assert.ok(body.includes(value), `Missing retained result: ${value}`);
  assert.match(quality, /Baseline:/); assert.match(performance, /Reference commit:/);
});
