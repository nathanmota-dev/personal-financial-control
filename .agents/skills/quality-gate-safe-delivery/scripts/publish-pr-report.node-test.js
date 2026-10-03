"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const Publisher = require("./publish-pr-report.js"), R = require("./pr-report.js");
function fixture(options = {}) {
  const calls = [], sha = "current-sha", pr = { number: 3, state: "open", head: { sha }, base: { sha: "base" } };
  const run = (id) => ({ id, event: "pull_request", head_sha: sha, run_attempt: 2, status: "completed", conclusion: "success", created_at: "2026-09-01T00:00:00Z", pull_requests: [{ number: 3, head: { sha } }], html_url: `https://github.com/test/repo/actions/runs/${id}` });
  const runs = { 1: [run(11)], 2: [run(12)] };
  if (options.cancelled) runs[2][0].conclusion = "cancelled";
  if (options.pending) runs[2][0].status = "in_progress";
  if (options.missing) runs[2] = [];
  function endpoint(kind) {
    const result = async (input) => {
      calls.push({ kind, input });
      if (options.publishError && ["create", "update"].includes(kind)) throw new Error("Publication rejected");
      if (kind === "content") {
        if (!options.established || (options.firstBaseline && input.path.includes("baseline"))) throw Object.assign(new Error("not found"), { status: 404 });
        return { data: {} };
      }
      if (kind === "pull") return { data: options.headChanged ? { ...pr, head: { sha: "new-sha" } } : pr };
      return { data: {} };
    };
    result.kind = kind; return result;
  }
  const github = {
    rest: {
      repos: { listPullRequestsAssociatedWithCommit: endpoint("associated"), getContent: endpoint("content"), createCommitStatus: endpoint("status") },
      actions: { listRepoWorkflows: endpoint("workflows"), listWorkflowRuns: endpoint("runs") },
      pulls: { listFiles: endpoint("files"), get: endpoint("pull") },
      issues: { listComments: endpoint("comments"), updateComment: endpoint("update"), createComment: endpoint("create"), deleteComment: endpoint("delete") },
    },
    async paginate(method, args) {
      if (method.kind === "associated") return options.stale ? [{ ...pr, head: { sha: "new-sha" } }] : [pr];
      if (method.kind === "workflows") return [{ id: 1, name: "PR Quality Gate" }, { id: 2, name: "Performance" }];
      if (method.kind === "runs") return runs[args.workflow_id];
      if (method.kind === "files") return options.files || [];
      if (method.kind === "comments") return options.comments || [];
      throw new Error(`Unexpected endpoint ${method.kind}`);
    },
  };
  const context = { repo: { owner: "test", repo: "repo" }, payload: { action: "completed", workflow_run: { head_sha: sha, pull_requests: [] } }, serverUrl: "https://github.com", runId: 50 };
  async function downloadReport(root, repository, number, workflow, selected) {
    if (options.artifactMissing) throw new Error("Report artifact missing");
    return { manifest: { schemaVersion: 1, headSha: sha, runId: selected.id, runAttempt: options.oldArtifact ? 1 : 2, overall: "PASS", checks: [
      { name: "required metric check", outcome: options.skipped ? "skipped" : "success", selected: true, blocking: true },
      { name: "high audit", outcome: "failure", selected: true, blocking: false },
    ] }, metrics: { schemaVersion: 1, headSha: options.oldMetrics ? "old-sha" : sha, runId: selected.id, runAttempt: 2, status: options.failedMetrics ? "fail" : "pass" }, report: `# ${workflow}\n\nDetailed coverage and performance measurements.` };
  }
  return { calls, args: { github, context, core: { info() {} }, downloadReport } };
}
test("publisher creates one detailed bot report and passing status from current attempt", async () => {
  const { calls, args } = fixture(); const result = await Publisher.reconcileAndPublish(args);
  assert.equal(result.state, "PASS"); assert.match(result.body, /Detailed coverage and performance/); assert.match(result.body, /WARNING/);
  assert.equal(calls.filter((call) => call.kind === "create").length, 1);
  assert.equal(calls.filter((call) => call.kind === "status").at(-1).input.state, "success");
});
test("publisher updates the owned sticky report, removes duplicates and leaves human comments", async () => {
  const comments = [{ id: 1, user: { type: "Bot" }, body: R.MARKER }, { id: 2, user: { type: "Bot" }, body: R.MARKER }, { id: 3, user: { type: "User" }, body: R.MARKER }];
  const { calls, args } = fixture({ comments }); await Publisher.reconcileAndPublish(args);
  assert.equal(calls.find((call) => call.kind === "update").input.comment_id, 1);
  assert.deepEqual(calls.filter((call) => call.kind === "delete").map((call) => call.input.comment_id), [2]);
});
test("missing or previous-attempt artifacts cannot produce a pass", async () => {
  for (const options of [{ artifactMissing: true }, { oldArtifact: true }, { oldMetrics: true }, { failedMetrics: true }]) {
    const { calls, args } = fixture(options); const result = await Publisher.reconcileAndPublish(args);
    assert.equal(result.state, "FAIL"); assert.equal(calls.find((call) => call.kind === "status").input.state, "failure");
  }
});
test("cancelled workflow and manifest with skipped required check fail even if artifact overall says PASS", async () => {
  for (const options of [{ cancelled: true }, { skipped: true }]) assert.equal((await Publisher.reconcileAndPublish(fixture(options).args)).state, "FAIL");
});
test("running required work remains pending; absent completed work fails", async () => {
  assert.equal((await Publisher.reconcileAndPublish(fixture({ pending: true }).args)).state, "PENDING");
  assert.equal((await Publisher.reconcileAndPublish(fixture({ missing: true }).args)).state, "FAIL");
});
test("older SHA events and heads changed during reconciliation do not publish", async () => {
  for (const options of [{ stale: true }, { headChanged: true }]) {
    const { args, calls } = fixture(options); assert.equal(await Publisher.reconcileAndPublish(args), undefined);
    assert.equal(calls.some((call) => ["status", "create", "update"].includes(call.kind)), false);
  }
});
test("protected infrastructure changes fail once installed, initial bootstrap is allowed", async () => {
  const files = [{ filename: "scripts/quality-gate.js" }];
  assert.equal((await Publisher.reconcileAndPublish(fixture({ files, established: true }).args)).state, "FAIL");
  assert.equal((await Publisher.reconcileAndPublish(fixture({ files }).args)).state, "PASS");
});
test("initial reference can be established after installation but existing reference stays protected", async () => {
  const files = [{ filename: "scripts/baseline.json" }];
  assert.equal((await Publisher.reconcileAndPublish(fixture({ files, established: true, firstBaseline: true }).args)).state, "PASS");
  assert.equal((await Publisher.reconcileAndPublish(fixture({ files, established: true }).args)).state, "FAIL");
});
test("publication failure cannot leave a newly passing status", async () => {
  const { calls, args } = fixture({ publishError: true });
  await assert.rejects(Publisher.reconcileAndPublish(args), /Publication rejected/);
  assert.ok(calls.filter((call) => call.kind === "status").every((call) => call.input.state !== "success"));
});
