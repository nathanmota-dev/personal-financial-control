"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const Publisher = require("./publish-pr-report.js"), R = require("./pr-report.js");
const P = require("./pr-validation.js");
function fixture(options = {}) {
  const calls = [], sha = "current-sha", pr = { number: 3, state: "open", head: { sha }, base: { sha: "base" } };
  const run = (id) => ({ id, event: "pull_request", head_sha: sha, run_attempt: 2, status: "completed", conclusion: "success", created_at: "2026-09-01T00:00:00Z", pull_requests: [{ number: 3, head: { sha } }], html_url: `https://github.com/test/repo/actions/runs/${id}` });
  const runs = Object.fromEntries(P.WORKFLOWS.map((name, index) => [index + 1, [run(index + 11)]]));
  if (options.cancelled) runs[2][0].conclusion = "cancelled";
  if (options.pending) runs[2][0].status = "in_progress";
  if (options.inline) runs[1][0].status = "in_progress";
  if (options.missing) runs[2] = [];
  if (options.missingWorkflow) runs[P.WORKFLOWS.indexOf(options.missingWorkflow) + 1] = [];
  if (options.failedWorkflow) runs[P.WORKFLOWS.indexOf(options.failedWorkflow) + 1][0].conclusion = "failure";
  function endpoint(kind) {
    const result = async (input) => {
      calls.push({ kind, input });
      if (options.publishError && ["create", "update"].includes(kind)) throw new Error("Publication rejected");
      if (kind === "content") {
        if (!options.established || ((options.firstBaseline || (options.baselineOnlyOnMain && input.ref === "ancestor")) && input.path.includes("baseline"))) throw Object.assign(new Error("not found"), { status: 404 });
        return { data: {} };
      }
      if (kind === "pull") return { data: options.headChanged ? { ...pr, head: { sha: "new-sha" } } : pr };
      return { data: {} };
    };
    result.kind = kind; return result;
  }
  const github = {
    rest: {
      repos: { listPullRequestsAssociatedWithCommit: endpoint("associated"), getContent: endpoint("content"), compareCommitsWithBasehead: async () => ({ data: { merge_base_commit: { sha: "ancestor" } } }), createCommitStatus: endpoint("status") },
      actions: { listRepoWorkflows: endpoint("workflows"), listWorkflowRuns: endpoint("runs") },
      pulls: { listFiles: endpoint("files"), get: endpoint("pull") },
      issues: { listComments: endpoint("comments"), updateComment: endpoint("update"), createComment: endpoint("create"), deleteComment: endpoint("delete") },
    },
    async paginate(method, args) {
      if (method.kind === "associated") return options.stale ? [{ ...pr, head: { sha: "new-sha" } }] : [pr];
      if (method.kind === "workflows") return P.WORKFLOWS.map((name, index) => ({ id: index + 1, name }));
      if (method.kind === "runs") return runs[args.workflow_id];
      if (method.kind === "files") return options.files || [];
      if (method.kind === "comments") return options.comments || [];
      throw new Error(`Unexpected endpoint ${method.kind}`);
    },
  };
  const context = { repo: { owner: "test", repo: "repo" }, payload: { action: "completed", workflow_run: { head_sha: sha, pull_requests: [] } }, serverUrl: "https://github.com", runId: options.inline ? 11 : 50 };
  async function downloadReport(root, repository, number, workflow, selected) {
    if (options.artifactMissing) throw new Error("Report artifact missing");
    const manifest = { schemaVersion: 1, headSha: sha, runId: selected.id, runAttempt: options.oldArtifact ? 1 : 2, overall: "PASS", checks: [
      { name: "required metric check", outcome: options.skipped ? "skipped" : "success", selected: true, blocking: true },
      { name: "high audit", outcome: "failure", selected: true, blocking: false },
    ] };
    if (!P.workflowDefinition(workflow).metrics) return { manifest };
    return { manifest, metrics: { schemaVersion: 1, headSha: options.oldMetrics ? "old-sha" : sha, runId: selected.id, runAttempt: 2, status: options.failedMetrics ? "fail" : "pass" }, report: `# ${workflow}\n\nDetailed coverage and performance measurements.` };
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
test("publisher checks reference existence at the merge base instead of the advanced main", async () => {
  const { args, calls } = fixture({ established: true, baselineOnlyOnMain: true, files: [{ filename: "scripts/benchmark-baseline.json" }] });
  assert.equal((await Publisher.reconcileAndPublish(args)).state, "PASS");
  assert.ok(calls.some((call) => call.kind === "content" && call.input.path === "scripts/benchmark-baseline.json" && call.input.ref === "ancestor"));
});
test("passing metric comparison remains distinct from a failed workflow with protected-file details", async () => {
  const { args } = fixture();
  const original = args.downloadReport;
  args.downloadReport = async (...params) => {
    const data = await original(...params);
    if (params[3] === "PR Quality Gate") data.manifest.checks.push({ name: "Validation policy immutability", outcome: "failure", details: ["scripts/quality-gate.js"] });
    return data;
  };
  const result = await Publisher.reconcileAndPublish(args);
  assert.equal(result.state, "FAIL"); assert.match(result.body, /metric comparison: \*\*PASS\*\*; overall: \*\*FAIL\*\*/);
  assert.match(result.body, /Validation policy immutability[\s\S]*scripts\/quality-gate.js/);
});
test("publication failure cannot leave a newly passing status", async () => {
  const { calls, args } = fixture({ publishError: true });
  await assert.rejects(Publisher.reconcileAndPublish(args), /Publication rejected/);
  assert.ok(calls.filter((call) => call.kind === "status").every((call) => call.input.state !== "success"));
});
test("inline report uses the finished quality job while its parent workflow is still running", async () => {
  const { args } = fixture({ inline: true });
  const result = await Publisher.reconcileAndPublish({ ...args, currentEvaluation: { conclusion: "success", attempt: 2 } });
  assert.equal(result.state, "PASS");
});
test("inline report cannot hide failed quality checks or borrow another attempt's result", async () => {
  for (const conclusion of ["failure", "cancelled", "skipped"]) {
    const { args } = fixture({ inline: true });
    assert.equal((await Publisher.reconcileAndPublish({ ...args, currentEvaluation: { conclusion, attempt: 2 } })).state, "FAIL");
  }
  for (const change of [{ attempt: 1 }, { runId: 99 }]) {
    const { args } = fixture({ inline: true });
    if (change.runId) args.context.runId = change.runId;
    assert.equal((await Publisher.reconcileAndPublish({ ...args, currentEvaluation: { conclusion: "success", attempt: change.attempt || 2 } })).state, "PENDING");
  }
});
test("performance timeout publishes failure rather than leaving a pending report", async () => {
  const { args } = fixture({ inline: true, pending: true });
  const result = await Publisher.reconcileAndPublish({ ...args, currentEvaluation: { conclusion: "success", attempt: 2 }, timedOutWorkflows: ["Performance"] });
  assert.equal(result.state, "FAIL"); assert.match(result.body, /Timed out/);
});
function waitingFixture(sequences, options = {}) {
  const pr = { number: 3, state: "open", head: { sha: "current-sha" } };
  let polls = 0, elapsed = 0;
  const args = {
    context: { repo: { owner: "test", repo: "repo" }, payload: { pull_request: pr } },
    core: { info() {} }, timeoutMs: 3, intervalMs: 1, now: () => elapsed,
    workflows: [P.workflowDefinition("Performance")],
    sleep: async (ms) => { elapsed += ms; },
    github: {
      rest: { pulls: { get: async () => ({ data: options.stale ? { ...pr, head: { sha: "new-sha" } } : pr }) }, actions: { listWorkflowRuns() {} } },
      async paginate(method, input) {
        assert.equal(input.head_sha, pr.head.sha); assert.equal(input.event, "pull_request");
        assert.equal(input.workflow_id, "performance.yml");
        return sequences[Math.min(polls++, sequences.length - 1)];
      },
    },
  };
  return { args, polls: () => polls };
}
function performanceRun(id, status, attempt = 1) {
  return { id, head_sha: "current-sha", event: "pull_request", status, run_attempt: attempt,
    created_at: `2026-09-${String(id).padStart(2, "0")}T00:00:00Z`, pull_requests: [] };
}
test("inline publisher waits through missing and running performance work for the latest attempt", async () => {
  const old = performanceRun(1, "completed"), running = performanceRun(2, "in_progress", 2);
  const { args, polls } = waitingFixture([[], [old, running], [old, { ...running, status: "completed", conclusion: "failure" }]]);
  assert.deepEqual(await Publisher.waitForWorkflows(args), { timedOut: [] }); assert.equal(polls(), 3);
});
test("inline publisher stops waiting at the deadline or when the PR head changes", async () => {
  const waiting = waitingFixture([[]]);
  assert.deepEqual(await Publisher.waitForWorkflows(waiting.args), { timedOut: ["Performance"] }); assert.equal(waiting.polls(), 3);
  const stale = waitingFixture([[]], { stale: true });
  assert.deepEqual(await Publisher.waitForWorkflows(stale.args), { timedOut: [] }); assert.equal(stale.polls(), 0);
});
test("backend, frontend and E2E are required and cannot be hidden by passing quality metrics", async () => {
  for (const name of ["Backend CI", "Frontend CI", "E2E"]) {
    const passed = await Publisher.reconcileAndPublish(fixture().args);
    assert.match(passed.body, new RegExp(`${name} overall: \\*\\*PASS`));
    for (const options of [{ failedWorkflow: name }, { missingWorkflow: name }]) {
      assert.equal((await Publisher.reconcileAndPublish(fixture(options).args)).state, "FAIL");
    }
  }
});
test("initial report waits for every required workflow and names only timed out workflows", async () => {
  const waiting = waitingFixture([[]]);
  delete waiting.args.workflows;
  waiting.args.github.paginate = async (method, input) => [performanceRun(1, input.workflow_id === "e2e.yml" ? "in_progress" : "completed")];
  assert.deepEqual(await Publisher.waitForWorkflows(waiting.args), { timedOut: ["E2E"] });
});
