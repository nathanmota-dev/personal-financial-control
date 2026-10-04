"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const P = require("./pr-validation.js"), H = require("./test-helpers.js");
function run(id, sha = "abc", attempt = 1) { return { id, head_sha: sha, event: "pull_request", run_attempt: attempt, created_at: `2026-09-${String(id).padStart(2, "0")}T00:00:00Z`, status: "completed", conclusion: "success", pull_requests: [{ number: 3, head: { sha } }] }; }
test("package selection covers root, monorepo, shared sources, renamed and unrelated files", () => {
  const config = H.config([H.project("backend", "backend"), H.project("frontend", "frontend")]);
  assert.deepEqual(P.selectProjects(config, ["backend/src/work.ts"]), ["backend"]);
  assert.deepEqual(P.selectProjects(config, [{ filename: "README.md", previous_filename: "frontend/src/old.ts" }]), ["frontend"]);
  assert.deepEqual(P.selectProjects(config, ["scripts/benchmark-gate.js"]), ["backend", "frontend"]);
  assert.deepEqual(P.selectProjects(config, ["README.md"]), []);
  assert.deepEqual(P.selectProjects(H.config(), ["src/index.js"]), ["app"]);
  assert.deepEqual(P.selectProjects(H.config([{ ...H.project(), sourceRoots: ["lib"] }]), ["lib/index.js"]), ["app"]);
});
test("latest attempts are scoped to exact PR and SHA; greatest attempt wins for each run", () => {
  const wrongPR = { ...run(9), pull_requests: [{ number: 4 }] };
  const runs = [run(1), { ...run(2, "abc", 1), run_started_at: "2026-09-30T00:00:00Z" }, run(2, "abc", 2), run(9, "old"), wrongPR];
  assert.equal(P.latestRun(runs, 3, "abc").run_attempt, 2);
  assert.equal(P.latestRun(runs, 3, "different"), null);
});
test("standalone source roots select performance on edits, deletions and renames", () => {
  const config = H.config([{ ...H.project(), sourceRoots: ["app", "./proxy.ts"] }]);
  assert.deepEqual(P.selectProjects(config, ["proxy.ts"]), ["app"]);
  assert.deepEqual(P.selectProjects(config, [{ filename: "app/proxy.ts", previous_filename: "proxy.ts" }]), ["app"]);
  assert.deepEqual(P.selectProjects(config, ["other-proxy.ts"]), []);
});
test("failures, cancellation, timeouts, required missing and pending workflows classify correctly", () => {
  for (const conclusion of ["failure", "cancelled", "timed_out", "skipped", null]) assert.equal(P.classify({ ...run(1), conclusion }), "FAIL");
  assert.equal(P.classify(null, true), "PENDING"); assert.equal(P.classify(null, false), "FAIL");
  assert.equal(P.classify({ ...run(1), status: "in_progress" }), "PENDING"); assert.equal(P.classify(run(1)), "PASS");
  assert.equal(P.aggregate(["PASS", "PENDING"]), "PENDING"); assert.equal(P.aggregate(["PENDING", "FAIL"]), "FAIL");
});
test("artifact identity includes exact run attempt and header provenance", () => {
  const selected = run(2, "abc", 3);
  assert.equal(P.artifactName("quality", 3, selected), "quality-pr-3-2-3");
  const manifest = { schemaVersion: 1, headSha: "abc", runId: "2", runAttempt: "3", checks: [] };
  assert.equal(P.correctArtifact(manifest, "abc", selected), true);
  for (const changed of [{ headSha: "old" }, { runAttempt: "1" }, { runId: "99" }]) assert.equal(P.correctArtifact({ ...manifest, ...changed }, "abc", selected), false);
});
test("infrastructure guard protects gate files without freezing unrelated utilities or dependencies", () => {
  for (const file of ["scripts/quality-gate.js", "scripts/paired-benchmarks.js", "scripts/promote-baselines.node-test.js", "scripts/pr-report.node-test.js", "scripts/baseline.json", "scripts/benchmark-baseline.local.json", ".github/workflows/performance.yml", ".github/workflows/promote-baselines.yml", "frontend/benchmarks/a.ts", "backend/vitest.benchmark.config.ts"]) assert.equal(P.protectedFile(file), true);
  for (const file of ["scripts/import-customers.js", "frontend/package.json", "src/index.ts", ".github/workflows/deploy.yml"]) assert.equal(P.protectedFile(file), false);
});
