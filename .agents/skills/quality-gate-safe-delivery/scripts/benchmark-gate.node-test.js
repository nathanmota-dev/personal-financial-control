"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const B = require("./benchmark-gate.js"), C = require("./config.js"), H = require("./test-helpers.js");
function snapshot(hz = 100) { return { schemaVersion: 1, policy: { maxRegressionPercent: 20 }, projects: { app: B.extract(H.rawBench(hz), "app") } }; }
test("extract preserves all Vitest statistics and stable full benchmark names", () => {
  assert.deepEqual(Object.values(B.extract(H.rawBench(), "app").benchmarks)[0], H.stats());
});
test("malformed, empty, duplicate and invalid statistic reports fail closed", () => {
  for (const raw of [{}, { files: [] }, { files: [{ groups: [] }] }]) assert.throws(() => B.extract(raw, "app"));
  const duplicate = H.rawBench(); duplicate.files[0].groups[0].benchmarks.push(duplicate.files[0].groups[0].benchmarks[0]);
  assert.throws(() => B.extract(duplicate, "app"), /Duplicate/);
  for (const [key, value] of [["hz", 0], ["mean", Infinity], ["rme", -1], ["sampleCount", 0.5]]) assert.throws(() => B.statistics({ ...H.stats(), [key]: value }, "test"));
});
test("performance passes gains, 19% loss and exact 20%; fails >20%", () => {
  for (const hz of [110, 81, 80]) assert.equal(B.compare(snapshot(), snapshot(hz), ["app"]).passed, true);
  assert.equal(B.compare(snapshot(), snapshot(79.99), ["app"]).passed, false);
});
test("missing tracked benchmark blocks, new benchmark warns", () => {
  const current = snapshot(); current.projects.app.benchmarks = { new: H.stats() };
  const result = B.compare(snapshot(), current, ["app"]);
  assert.equal(result.passed, false); assert.equal(result.warnings.length, 1); assert.equal(result.results[0].status, "MISSING");
});
test("empty project selection skips comparisons; bootstrap is distinct", () => {
  assert.deepEqual(B.compare(snapshot(), { projects: {} }, []).results, []);
  assert.equal(B.compare(null, snapshot(), ["app"]).results[0].status, "BOOTSTRAP");
});
test("baseline schema, project set and protected limit are checked", () => {
  assert.equal(B.validateBaseline(snapshot(), ["app"]).schemaVersion, 1);
  assert.throws(() => B.validateBaseline({ ...snapshot(), policy: { maxRegressionPercent: 30 } }, ["app"]));
  assert.throws(() => B.validateBaseline(snapshot(), ["backend"]));
});
test("render shows stats, selected/skipped projects and safe benchmark names", () => {
  const old = snapshot(), current = snapshot(80), comparison = B.compare(old, current, ["app"]);
  comparison.results[0].key = "name|@everyone\nvalue";
  const body = B.render(old, comparison, ["app"], ["app", "frontend"], "base");
  assert.match(body, /RME \| Samples/); assert.match(body, /name\\\|&#64;everyone value/); assert.match(body, /Skipped projects: frontend/);
});
test("CLI bootstrap creates real candidates and established comparison blocks losses", (t) => {
  const root = H.temporary(t); H.write(root, "scripts/quality-gate.config.json", H.config()); H.write(root, "reports/benchmarks/app.json", H.rawBench());
  assert.equal(H.cli("benchmark-gate.js", root, ["--bootstrap"]).status, 0);
  fs.copyFileSync(path.join(root, "reports/benchmark-candidate-baseline.json"), path.join(root, "scripts/benchmark-baseline.json"));
  H.write(root, "reports/benchmarks/app.json", H.rawBench(79));
  assert.equal(H.cli("benchmark-gate.js", root).status, 1);
  assert.equal(C.readJson(path.join(root, "reports/performance.json")).status, "fail");
});
test("CLI unknown selection/missing inputs/CI promotion return input failure", (t) => {
  const root = H.temporary(t); H.write(root, "scripts/quality-gate.config.json", H.config());
  for (const args of [["--bootstrap"], ["--bootstrap", "--projects", "unknown"], ["--update-baseline"]]) assert.equal(H.cli("benchmark-gate.js", root, args, { CI: "true" }).status, 2);
});
