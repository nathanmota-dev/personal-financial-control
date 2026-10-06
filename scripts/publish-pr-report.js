"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const C = require("./config.js");
const P = require("./pr-validation.js");
const W = require("./workflow-report.js");
const R = require("./pr-report.js");

function download(root, repository, number, workflow, run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pr-gate-artifact-"));
  try {
    const definition = P.workflowDefinition(workflow), key = definition.key;
    const result = C.execute(["gh", "run", "download", String(run.id), "--repo", repository,
      "--name", P.artifactName(key, number, run), "--dir", directory], root);
    if (result.status !== 0) throw new C.InputError(`Artifact unavailable: ${workflow}`);
    function find(name, current = directory) {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        if (entry.isSymbolicLink()) continue;
        const file = path.join(current, entry.name);
        if (entry.isFile() && entry.name === name) return file;
        if (entry.isDirectory()) { const match = find(name, file); if (match) return match; }
      }
      return null;
    }
    const manifestPath = find(`${key}-workflow.json`);
    if (!manifestPath) throw new C.InputError(`Incomplete artifacts: ${workflow}`);
    if (!definition.metrics) return { manifest: C.readJson(manifestPath) };
    const reportPath = find(`${definition.stem}.md`), metricPath = find(`${definition.stem}.json`);
    if (!manifestPath || !reportPath || !metricPath) throw new C.InputError(`Incomplete artifacts: ${workflow}`);
    if (fs.statSync(reportPath).size > 5 * 1024 * 1024) throw new C.InputError("Report artifact too large.");
    return { manifest: C.readJson(manifestPath), metrics: C.readJson(metricPath), report: fs.readFileSync(reportPath, "utf8") };
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}
async function waitForWorkflows({ github, context, core, timeoutMs = 600000, intervalMs = 15000,
  workflows = P.WORKFLOW_DEFINITIONS.filter((workflow) => workflow.key !== "quality"),
  now = Date.now, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  const pr = context.payload.pull_request, deadline = now() + timeoutMs;
  let pending = workflows.map((workflow) => workflow.name);
  while (now() < deadline) {
    const current = await github.rest.pulls.get({ ...context.repo, pull_number: pr.number });
    if (current.data.state !== "open" || current.data.head.sha !== pr.head.sha) return { timedOut: [] };
    pending = [];
    for (const workflow of workflows) {
      const runs = await github.paginate(github.rest.actions.listWorkflowRuns, {
        ...context.repo, workflow_id: workflow.file, event: "pull_request", head_sha: pr.head.sha, per_page: 100,
      });
      const scoped = runs.map((run) => ({ ...run, pull_requests: run.pull_requests?.length ? run.pull_requests : [pr] }));
      const run = P.latestRun(scoped, pr.number, pr.head.sha);
      if (run?.status !== "completed") pending.push(workflow.name);
    }
    if (!pending.length) return { timedOut: [] };
    core.info(`Waiting for the current SHA's latest attempts: ${pending.join(", ")}.`);
    await sleep(Math.min(intervalMs, Math.max(0, deadline - now())));
  }
  return { timedOut: pending };
}
async function reconcileAndPublish({ github, context, core, root = process.cwd(), downloadReport = download,
  currentEvaluation, timedOutWorkflows = [] }) {
  const repo = context.repo, event = context.payload.workflow_run, sha = event.head_sha;
  const associated = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, { ...repo, commit_sha: sha, per_page: 100 });
  const pr = [...associated, ...(event.pull_requests || [])].find((item) => item.state === "open" && item.head?.sha === sha);
  if (!pr) { core.info("Ignoring an old workflow event without a current open PR."); return; }
  const catalog = await github.paginate(github.rest.actions.listRepoWorkflows, { ...repo, per_page: 100 });
  const workflows = [];
  for (const name of P.WORKFLOWS) {
    const definition = catalog.find((workflow) => workflow.name === name);
    const runs = definition ? await github.paginate(github.rest.actions.listWorkflowRuns, { ...repo, workflow_id: definition.id, event: "pull_request", head_sha: sha, per_page: 100 }) : [];
    // GitHub sometimes omits pull_requests; the API association above establishes this PR/SHA.
    const scoped = runs.map((run) => ({ ...run, pull_requests: run.pull_requests?.length ? run.pull_requests : [{ number: pr.number, head: { sha } }] }));
    let run = P.latestRun(scoped, pr.number, sha);
    // The inline publisher is still running, but its prerequisite gate job is finished.
    // Only use needs.evaluate.result for this exact run and attempt, never another run.
    if (currentEvaluation && name === "PR Quality Gate" && run?.status !== "completed"
      && String(run?.id) === String(context.runId) && run.run_attempt === currentEvaluation.attempt
      && ["success", "failure", "cancelled", "skipped"].includes(currentEvaluation.conclusion)) {
      run = { ...run, status: "completed", conclusion: currentEvaluation.conclusion };
    }
    workflows.push({ name, run, url: run?.html_url });
  }
  const running = workflows.some((workflow) => workflow.run && workflow.run.status !== "completed");
  const details = [];
  for (const workflow of workflows) {
    workflow.state = P.classify(workflow.run, running || context.payload.action !== "completed");
    if (timedOutWorkflows.includes(workflow.name)) {
      workflow.state = "FAIL";
      details.push(`## ${C.escape(workflow.name)}\n\n**FAIL** — Timed out waiting for the matching workflow.`);
    }
    if (workflow.run?.status !== "completed") continue;
    try {
      const data = await downloadReport(root, `${repo.owner}/${repo.repo}`, pr.number, workflow.name, workflow.run);
      if (!P.correctArtifact(data.manifest, sha, workflow.run)) throw new C.InputError("Artifact provenance mismatch.");
      if (P.workflowDefinition(workflow.name).metrics) {
        if (!data.metrics || !P.correctArtifact({ ...data.metrics, checks: [] }, sha, workflow.run)) throw new C.InputError("Metric artifact provenance mismatch.");
        if (!["pass", "bootstrap", "fail", "error"].includes(data.metrics.status)) throw new C.InputError("Unknown metric report status.");
      }
      workflow.manifest = data.manifest;
      workflow.metricStatus = data.metrics?.status;
      const actual = W.overall(data.manifest.checks.map(W.normalize));
      if (actual !== "PASS" || ["fail", "error"].includes(data.metrics?.status)) workflow.state = "FAIL";
      if (data.report) details.push(data.report);
    } catch (error) {
      workflow.state = "FAIL";
      details.push(`## ${workflow.name}\n\n**FAIL** — ${C.escape(error.message)}. Inspect the workflow artifacts in Actions.`);
    }
  }
  const files = await github.paginate(github.rest.pulls.listFiles, { ...repo, pull_number: pr.number, per_page: 100 });
  let established = true;
  try { await github.rest.repos.getContent({ ...repo, path: "scripts/quality-gate.config.json", ref: pr.base.sha }); }
  catch (error) { if (error.status === 404) established = false; else throw error; }
  let ancestor = pr.base.sha;
  if (established) {
    const comparison = await github.rest.repos.compareCommitsWithBasehead({ ...repo, basehead: `${pr.base.sha}...${sha}` });
    ancestor = comparison.data.merge_base_commit?.sha;
    if (!ancestor) throw new C.InputError("Cannot resolve PR merge base for protected files.");
  }
  const infrastructure = established ? files.flatMap((entry) => [entry.filename, entry.previous_filename].filter(Boolean))
    .filter((file) => P.protectedFile(file) && !P.blockingPolicyFile(file, pr.head.ref)) : [];
  if (infrastructure.length) details.unshift(`## Validation infrastructure review\n\n**WARNING** — CI maintenance paths changed: ${infrastructure.map(C.escape).join(", ")}. Policy inputs remain protected.`);
  const protectedChanges = [];
  for (const file of established ? files.flatMap((entry) => [entry.filename, entry.previous_filename].filter(Boolean)).filter((file) => P.blockingPolicyFile(file, pr.head.ref)) : []) {
    if (["scripts/baseline.json", "scripts/benchmark-baseline.json", "scripts/benchmark-baseline.local.json"].includes(file)) {
      try { await github.rest.repos.getContent({ ...repo, path: file, ref: ancestor }); }
      catch (error) { if (error.status === 404) continue; throw error; }
    }
    protectedChanges.push(file);
  }
  const state = protectedChanges.length ? "FAIL" : P.aggregate(workflows.map((workflow) => workflow.state));
  if (protectedChanges.length) details.unshift(`## Validation infrastructure changes\n\n**FAIL** — Protected paths changed: ${protectedChanges.map(C.escape).join(", ")}.`);
  // Re-check the head before writing: a newer commit can arrive during reconciliation.
  const current = await github.rest.pulls.get({ ...repo, pull_number: pr.number });
  if (current.data.head.sha !== sha || current.data.state !== "open") { core.info("PR head changed; report ignored."); return; }
  const statuses = { PASS: "success", FAIL: "failure", PENDING: "pending" };
  await github.rest.repos.createCommitStatus({ ...repo, sha, state: state === "PASS" ? "pending" : statuses[state], context: "PR Validation",
    description: state === "PASS" ? "Publishing the validated report" : state === "PENDING" ? "Validation is running" : "Validation failed or required reports are missing",
    target_url: `${context.serverUrl}/${repo.owner}/${repo.repo}/actions/runs/${context.runId}` });
  const body = R.render({ number: pr.number, sha, state, workflows, details });
  const comments = await github.paginate(github.rest.issues.listComments, { ...repo, issue_number: pr.number, per_page: 100 });
  const existing = comments.filter((comment) => comment.user?.type === "Bot" && comment.body?.includes(R.MARKER));
  if (existing.length) await github.rest.issues.updateComment({ ...repo, comment_id: existing[0].id, body });
  else await github.rest.issues.createComment({ ...repo, issue_number: pr.number, body });
  for (const duplicate of existing.slice(1)) await github.rest.issues.deleteComment({ ...repo, comment_id: duplicate.id });
  if (state === "PASS") await github.rest.repos.createCommitStatus({ ...repo, sha, state: "success", context: "PR Validation",
    description: "All selected checks passed and the report was published", target_url: `${context.serverUrl}/${repo.owner}/${repo.repo}/actions/runs/${context.runId}` });
  return { state, body };
}
module.exports = { download, waitForWorkflows, reconcileAndPublish };
