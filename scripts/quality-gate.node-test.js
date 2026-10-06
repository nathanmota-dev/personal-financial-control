"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const path = require("node:path"), fs = require("node:fs");
const Q = require("./quality-gate.js"), C = require("./config.js"), H = require("./test-helpers.js");
test("aggregation weights measured counts rather than averaging package percentages", () => {
  const projects = { small: { coverage: H.coverage(1, 1) }, large: { coverage: H.coverage(0, 9) } };
  assert.equal(C.percentage(Q.aggregate(projects).lines), 10);
});
test("coverage requires complete scope, including files not imported by tests", (t) => {
  const root = H.temporary(t), measured = H.inputs(root), project = H.project();
  const summary = C.readJson(path.join(root, project.coveragePath));
  assert.equal(Q.parseCoverage(summary, root, project, measured.projects.app.files).coverageFileCount, 1);
  assert.throws(() => Q.parseCoverage({ total: H.coverage() }, root, project, measured.projects.app.files), /missing/);
  assert.throws(() => Q.parseCoverage({ ...summary, "src/other.js": H.coverage() }, root, project, measured.projects.app.files), /Unexpected/);
});
test("coverage rejects duplicate normalized paths and inconsistent totals", (t) => {
  const root = H.temporary(t), m = H.inputs(root), p = H.project(), summary = C.readJson(path.join(root, p.coveragePath));
  assert.throws(() => Q.parseCoverage({ ...summary, "src/index.js": H.coverage() }, root, p, m.projects.app.files), /duplicate/);
  assert.throws(() => Q.parseCoverage({ ...summary, total: H.coverage(9, 10) }, root, p, m.projects.app.files), /totals disagree/);
});
test("ESLint counts warnings and errors and validates input", () => {
  assert.equal(Q.parseEslint([{ errorCount: 2, warningCount: 3, suppressedMessages: [1] }]), 5);
  assert.throws(() => Q.parseEslint([{ errorCount: -1, warningCount: 0 }]));
});
test("JSCPD v4/v5 statistics, fragments and ratio consistency", () => {
  const report = H.duplicationReport(H.duplication(5, 100, 2));
  assert.deepEqual(Q.parseDuplication(report), H.duplication(5, 100, 2));
  assert.deepEqual(Q.parseDuplication({ statistic: report.statistics }), H.duplication(5, 100, 2));
  assert.throws(() => Q.parseDuplication({ statistics: { total: { ...report.statistics.total, percentage: 6 } } }), /Inconsistent/);
});
test("80% passes; each metric below the floor fails even during bootstrap", (t) => {
  const root = H.temporary(t), m = H.metrics(root);
  assert.equal(Q.compare(null, m).passed, true);
  for (const metric of C.METRICS) {
    const current = structuredClone(m); current.projects.app.coverage[metric].covered = 7;
    assert.match(Q.compare(null, current).failures.join(), /below 80/);
  }
});
test("package regression is not masked by another package or total improvement", (t) => {
  const root = H.temporary(t), baseline = H.metrics(root, [H.project("backend", "backend"), H.project("frontend", "frontend")]);
  baseline.projects.backend.coverage = H.coverage(9, 10);
  const current = structuredClone(baseline); current.projects.backend.coverage = H.coverage(8, 10); current.projects.frontend.coverage = H.coverage(10, 10); current.coverage = Q.aggregate(current.projects);
  assert.ok(Q.compare(baseline, current).failures.some((item) => item.includes("backend: lines coverage decreased")));
});
test("empty formerly measured coverage fails closed", (t) => {
  const root = H.temporary(t), old = H.metrics(root), current = structuredClone(old);
  current.projects.app.coverage = H.coverage(0, 0); current.coverage = Q.aggregate(current.projects);
  assert.equal(Q.compare(old, current).passed, false);
});
test("file/function limits are absolute, including old debt and exact boundaries", (t) => {
  const root = H.temporary(t), m = H.metrics(root);
  m.projects.app.files["src/index.js"] = 350; m.projects.app.functions[0].lines = 100;
  assert.equal(Q.compare(m, m).passed, true);
  for (const key of ["file", "function"]) {
    const current = structuredClone(m);
    if (key === "file") current.projects.app.files["src/index.js"] = 351; else current.projects.app.functions[0].lines = 101;
    assert.equal(Q.compare(current, current).passed, false);
  }
});
test("package and cross-package duplication/fragments cannot grow; empty old scans fail", (t) => {
  const root = H.temporary(t), baseline = H.metrics(root);
  for (const location of ["project", "global"]) {
    const current = structuredClone(baseline), target = location === "global" ? current : current.projects.app;
    target.duplication = H.duplication(1, 100, 1);
    assert.equal(Q.compare(baseline, current).passed, false);
  }
  const failures = []; Q.compareDuplication(H.duplication(0, 0, 0), H.duplication(0, 100, 0), "all", failures);
  assert.ok(failures.length);
});
test("nonzero lint debt cannot be grandfathered", (t) => {
  const root = H.temporary(t), m = H.metrics(root); m.projects.app.lintViolations = 1;
  assert.equal(Q.compare(m, m).passed, false);
});
test("CLI bootstrap produces reports/candidate, then compares a reviewed reference", (t) => {
  const root = H.temporary(t); H.inputs(root);
  assert.equal(H.cli("quality-gate.js", root, ["--bootstrap", "--no-collect"]).status, 0);
  assert.equal(C.readJson(path.join(root, "reports/quality-gate.json")).status, "bootstrap");
  fs.copyFileSync(path.join(root, "reports/candidate-baseline.json"), path.join(root, "scripts/baseline.json"));
  assert.equal(H.cli("quality-gate.js", root, ["--no-collect"]).status, 0);
  const report = fs.readFileSync(path.join(root, "reports/quality-gate.md"), "utf8");
  assert.match(report, /Weighted coverage[\s\S]*\n## Coverage\n[\s\S]*\n## Maintainability\n[\s\S]*Combined duplication/);
  assert.doesNotMatch(report, /app coverage|app maintainability/);
});
test("missing/malformed input returns 2 and a failure report, not green", (t) => {
  const root = H.temporary(t); H.inputs(root); H.write(root, "reports/eslint/app.json", "{");
  assert.equal(H.cli("quality-gate.js", root, ["--bootstrap", "--no-collect"]).status, 2);
  assert.equal(C.readJson(path.join(root, "reports/quality-gate.json")).status, "error");
});
test("CI reference updates and failing bootstrap promotions are rejected", (t) => {
  const root = H.temporary(t); H.inputs(root);
  assert.equal(H.cli("quality-gate.js", root, ["--update-baseline", "--no-collect"], { CI: "true" }).status, 2);
  const summary = { total: H.coverage(7, 10), [path.join(root, "src/index.js")]: H.coverage(7, 10) };
  H.write(root, "coverage/coverage-summary.json", summary);
  assert.equal(H.cli("quality-gate.js", root, ["--update-baseline", "--no-collect"], { CI: "false" }).status, 2);
  assert.equal(fs.existsSync(path.join(root, "scripts/baseline.json")), false);
});
test("rendering escapes markdown table injection and multiline names", (t) => {
  const root = H.temporary(t), m = H.metrics(root);
  const body = Q.render({ metrics: m, baseline: null, comparison: { passed: false, failures: ["name|@everyone\n<script>"] }, label: "base", bootstrap: true });
  assert.match(body, /name\\\|&#64;everyone &lt;script&gt;/);
});
test("no-regression mode accepts reviewed debt but blocks coverage loss for every metric", (t) => {
  const root = H.temporary(t), baseline = H.metrics(root);
  baseline.projects.app.coverage = H.coverage(4, 10);
  baseline.projects.app.files["src/index.js"] = 500;
  baseline.projects.app.functions[0].lines = 200;
  baseline.coverage = Q.aggregate(baseline.projects);
  assert.equal(Q.compare(baseline, baseline, "no-regression").passed, true);
  assert.ok(Q.compare(baseline, baseline, "no-regression").warnings.length);
  assert.equal(Q.compare(baseline, baseline).passed, false);
  for (const metric of C.METRICS) {
    const current = structuredClone(baseline);
    current.projects.app.coverage[metric].covered--;
    current.coverage = Q.aggregate(current.projects);
    assert.ok(Q.compare(baseline, current, "no-regression").failures.some((item) => item.includes(`${metric} coverage decreased`)));
  }
});
test("no-regression mode blocks size growth and new oversized files/functions", (t) => {
  const root = H.temporary(t), baseline = H.metrics(root);
  baseline.projects.app.files["src/index.js"] = 500;
  baseline.projects.app.functions[0].lines = 200;
  for (const mutate of [
    (p) => p.files["src/index.js"]++,
    (p) => p.functions[0].lines++,
    (p) => p.files["src/new.js"] = 351,
    (p) => p.functions.push({ file: "src/new.js", name: "newFunction", startLine: 1, lines: 101 }),
    (p) => p.functions.push({ ...p.functions[0], startLine: 250, lines: 101 }),
  ]) {
    const current = structuredClone(baseline); mutate(current.projects.app);
    assert.equal(Q.compare(baseline, current, "no-regression").passed, false);
  }
  const shifted = structuredClone(baseline); shifted.projects.app.functions[0].startLine += 10;
  assert.equal(Q.compare(baseline, shifted, "no-regression").passed, true);
});
test("no-regression mode still rejects lint and duplication regressions", (t) => {
  const root = H.temporary(t), baseline = H.metrics(root);
  for (const mutate of [(p) => p.lintViolations++, (p) => p.duplication.fragments++, (p) => p.duplication.duplicatedLines++]) {
    const current = structuredClone(baseline); mutate(current.projects.app);
    assert.equal(Q.compare(baseline, current, "no-regression").passed, false);
  }
});
test("authorized initial no-regression reference can be recorded, then cannot promote regressions", (t) => {
  const root = H.temporary(t); H.inputs(root);
  H.write(root, "scripts/quality-gate.config.json", { ...H.config(), qualityMode: "no-regression" });
  H.write(root, "coverage/coverage-summary.json", { total: H.coverage(4, 10), [path.join(root, "src/index.js")]: H.coverage(4, 10) });
  assert.equal(H.cli("quality-gate.js", root, ["--update-baseline", "--no-collect"], { CI: "false" }).status, 0);
  const original = fs.readFileSync(path.join(root, "scripts/baseline.json"), "utf8");
  H.write(root, "coverage/coverage-summary.json", { total: H.coverage(3, 10), [path.join(root, "src/index.js")]: H.coverage(3, 10) });
  assert.equal(H.cli("quality-gate.js", root, ["--no-collect"]).status, 1);
  assert.equal(H.cli("quality-gate.js", root, ["--update-baseline", "--no-collect"], { CI: "false" }).status, 2);
  assert.equal(fs.readFileSync(path.join(root, "scripts/baseline.json"), "utf8"), original);
});
