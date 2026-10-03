"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const C = require("./config.js"), H = require("./test-helpers.js");
test("config validates project names, duplicate names, commands and policy", () => {
  assert.equal(C.validateConfig(H.config()).projects.length, 1);
  for (const config of [H.config([{ ...H.project(), name: "../escape" }]), H.config([H.project(), H.project()]), H.config([{ ...H.project(), commands: {} }]), { ...H.config(), policy: { ...C.POLICY, minimumCoverage: 0 } }]) assert.throws(() => C.validateConfig(config));
});
test("equivalent policy key ordering is accepted; unsupported schemas are rejected", () => {
  const reordered = Object.fromEntries(Object.entries(C.POLICY).reverse());
  assert.equal(C.validateConfig({ ...H.config(), policy: reordered }).policy.minimumCoverage, 80);
  assert.throws(() => C.validateConfig({ ...H.config(), schemaVersion: 2 }));
});
test("paths and arguments cannot escape root or omit values", (t) => {
  const root = H.temporary(t);
  for (const value of ["../outside", "/tmp/outside"]) assert.throws(() => C.inside(root, value), /escapes/);
  assert.throws(() => C.argumentsFor(["--root"]), /requires/);
  assert.throws(() => C.argumentsFor(["--unknown"]), /Unknown/);
  assert.equal(C.argumentsFor(["--projects", ""]).projects, "");
});
test("configured source/report paths cannot escape a repository", (t) => {
  const root = H.temporary(t); H.write(root, "scripts/quality-gate.config.json", H.config([{ ...H.project(), coveragePath: "../outside" }]));
  assert.throws(() => C.loadConfig({ root }), /escapes/);
});
test("source counts and finite statistics reject negative, NaN and invalid ratios", () => {
  for (const value of [-1, NaN, Infinity]) assert.throws(() => C.finite(value, "test"));
  assert.throws(() => C.count(1.5, "test"));
  assert.throws(() => C.ratio({ covered: 2, total: 1 }, "test"));
});
test("no-regression mode is explicit and local benchmark paths cannot escape", (t) => {
  assert.equal(C.validateConfig({ ...H.config(), qualityMode: "no-regression" }).qualityMode, "no-regression");
  assert.throws(() => C.validateConfig({ ...H.config(), qualityMode: "ignore-failures" }), /Unknown quality mode/);
  const root = H.temporary(t);
  H.write(root, "scripts/quality-gate.config.json", { ...H.config(), localBenchmarkBaselinePath: "../outside.json" });
  assert.throws(() => C.loadConfig({ root }), /escapes/);
});
test("registered CI checks reject unknown workflows and malformed commands", () => {
  const valid = { name: "Tests", command: ["npm", "test"] };
  assert.doesNotThrow(() => C.validateConfig({ ...H.config(), ci: { workflows: { backend: [valid] } } }));
  for (const workflows of [{ unknown: [valid] }, { frontend: [] }, { backend: [{ ...valid, command: "npm test" }] }, { e2e: [{ ...valid, blocking: "no" }] }]) {
    assert.throws(() => C.validateConfig({ ...H.config(), ci: { workflows } }), /Invalid CI/);
  }
});
