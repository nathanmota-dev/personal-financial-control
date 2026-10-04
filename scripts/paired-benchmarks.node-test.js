"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const path = require("node:path");
const Paired = require("./paired-benchmarks.js"), B = require("./benchmark-gate.js"), C = require("./config.js"), H = require("./test-helpers.js");
function snapshot(hz = 100) { return { schemaVersion: 1, policy: { maxRegressionPercent: 20 }, projects: { app: B.extract(H.rawBench(hz), "app") } }; }
function git(root, ...args) {
  const result = C.execute(["git", ...args], root); assert.equal(result.status, 0, result.stderr); return result.stdout.trim();
}
function repository(t) {
  const root = H.temporary(t); git(root, "init", "-b", "main");
  git(root, "config", "user.email", "test@example.test"); git(root, "config", "user.name", "Test");
  H.write(root, "package.json", { name: "fixture" }); H.write(root, "benchmarks/work.bench.ts", "unchanged benchmark");
  git(root, "add", "."); git(root, "commit", "-m", "base");
  const sha = git(root, "rev-parse", "HEAD");
  const previous = process.env.PR_HEAD_SHA; process.env.PR_HEAD_SHA = sha;
  t.after(() => { if (previous === undefined) delete process.env.PR_HEAD_SHA; else process.env.PR_HEAD_SHA = previous; });
  return { root, sha };
}
test("median throughput ignores one fast outlier and blocks loss above 20%", () => {
  const reference = Paired.aggregateRuns([snapshot(100), snapshot(100), snapshot(1000)], snapshot(), ["app"]);
  const current = Paired.aggregateRuns([snapshot(79), snapshot(79), snapshot(1000)], snapshot(), ["app"]);
  assert.equal(Object.values(reference.projects.app.benchmarks)[0].hz, 100);
  assert.equal(B.compare(reference, current, ["app"]).passed, false);
  assert.equal(B.compare(reference, Paired.aggregateRuns([snapshot(80), snapshot(80), snapshot(1)], snapshot(), ["app"]), ["app"]).passed, true);
});
test("all three measurements must contain every required scenario", () => {
  const missing = snapshot(); missing.projects.app.benchmarks = {};
  for (const runs of [[snapshot(), snapshot()], [snapshot(), missing, snapshot()], [missing, missing, missing]]) assert.throws(() => Paired.aggregateRuns(runs, snapshot(), ["app"]), /three|Inconsistent|missing/);
  const malformed = snapshot(); Object.values(malformed.projects.app.benchmarks)[0].sampleCount = 0;
  assert.throws(() => Paired.aggregateRuns([snapshot(), malformed, snapshot()], snapshot(), ["app"]), /Invalid/);
});
test("invalid and unavailable commit references fail even with no selected packages", (t) => {
  const { root, sha } = repository(t);
  for (const headSha of ["main", "local", "f".repeat(40)]) assert.throws(() => Paired.run(root, H.config(), { ...snapshot(), headSha }, []), /commit/);
  assert.equal(Paired.run(root, H.config(), { ...snapshot(), headSha: sha }, []), 0);
});
test("paired runner uses isolated installs and sequential reference/current pairs with raw evidence", (t) => {
  const { root, sha } = repository(t), calls = [], installs = [];
  let pair = 0;
  const execute = (command, cwd) => {
    if (command[0] === "git") return C.execute(command, cwd);
    if (command[1] === "ci") installs.push(cwd);
    else {
      calls.push(path.basename(cwd)); if (path.basename(cwd) === "reference") pair++;
      H.write(cwd, "reports/benchmarks/app.json", H.rawBench(path.basename(cwd) === "reference" ? 100 : 81));
    }
    return { status: 0, stdout: "ok", stderr: "" };
  };
  assert.equal(Paired.run(root, H.config(), { ...snapshot(), headSha: sha }, ["app"], execute), 0);
  assert.equal(pair, 3); assert.equal(new Set(installs).size, 2);
  assert.deepEqual(calls, ["reference", "current", "reference", "current", "reference", "current"]);
  const report = C.readJson(path.join(root, "reports/performance.json"));
  assert.equal(report.evidence.referenceSha, sha); assert.equal(report.evidence.runs.current.length, 3);
  assert.equal(report.evidence.runs.reference[0].runtime.node, process.version);
  assert.equal(git(root, "worktree", "list", "--porcelain").split("worktree ").length - 1, 1);
});
test("failed install or missing raw measurement fails and removes both worktrees", (t) => {
  const { root, sha } = repository(t);
  for (const failInstall of [true, false]) {
    const execute = (command, cwd) => command[0] === "git" ? C.execute(command, cwd) : { status: failInstall ? 1 : 0, stdout: "", stderr: "" };
    assert.throws(() => Paired.run(root, H.config(), { ...snapshot(), headSha: sha }, ["app"], execute), /failed|Cannot read/);
    assert.equal(git(root, "worktree", "list", "--porcelain").split("worktree ").length - 1, 1);
  }
});
test("benchmark inputs and warmup configuration cannot change between paired commits", (t) => {
  const { root, sha } = repository(t);
  H.write(root, "vitest.benchmark.config.ts", "changed warmup"); git(root, "add", "."); git(root, "commit", "-m", "config");
  process.env.PR_HEAD_SHA = git(root, "rev-parse", "HEAD");
  assert.throws(() => Paired.run(root, H.config(), { ...snapshot(), headSha: sha }, ["app"]), /inputs\/configuration differ/);
});
