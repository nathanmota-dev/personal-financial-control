"use strict";
const WORKFLOWS = ["PR Quality Gate", "Performance"];
function selectProjects(config, files) {
  const normalized = files.flatMap((item) => typeof item === "string" ? [item] : [item.filename, item.previous_filename].filter(Boolean)).map((file) => file.replaceAll("\\", "/"));
  const infrastructure = normalized.some((file) => file.startsWith("scripts/") || file === ".github/workflows/performance.yml");
  return config.projects.filter((project) => infrastructure || normalized.some((file) =>
    project.sourceRoots.some((root) => file.startsWith(`${root.replace(/^\.\//, "")}/`)) ||
    (project.directory === "." ? /^(benchmarks\/|package(-lock)?\.json$|.*config\.[cm]?[jt]s$|tsconfig.*\.json$)/.test(file)
      : file.startsWith(`${project.directory}/`)))).map((project) => project.name);
}
function latestRun(runs, number, sha) {
  const attempts = new Map();
  for (const run of runs.filter((item) => item.head_sha === sha && item.event === "pull_request" &&
    (item.pull_requests || []).some((pr) => pr.number === number && (!pr.head?.sha || pr.head.sha === sha)))) {
    if (!attempts.has(run.id) || (attempts.get(run.id).run_attempt || 1) < (run.run_attempt || 1)) attempts.set(run.id, run);
  }
  return [...attempts.values()]
    .sort((a, b) => Date.parse(b.run_started_at || b.created_at) - Date.parse(a.run_started_at || a.created_at)
      || b.id - a.id || (b.run_attempt || 1) - (a.run_attempt || 1))[0] || null;
}
function classify(run, othersRunning = false) {
  if (!run) return othersRunning ? "PENDING" : "FAIL";
  if (run.status !== "completed") return "PENDING";
  return run.conclusion === "success" ? "PASS" : "FAIL";
}
function aggregate(checks) {
  return checks.includes("FAIL") ? "FAIL" : checks.includes("PENDING") ? "PENDING" : "PASS";
}
function protectedFile(file) {
  return /^scripts\/(?:(?:setup|config|source-scan|quality-gate|benchmark-gate|workflow-report|run-checks|pr-validation|pr-report|publish-pr-report|select-projects|test-helpers)(?:\.node-test)?\.js|package(?:-lock)?\.json|quality-gate\.config\.json|baseline\.json|benchmark-baseline\.json|templates\/.*)$/.test(file)
    || /^\.github\/workflows\/(?:quality-gate|performance|pr-validation)\.yml$/.test(file)
    || /(^|\/)benchmarks\//.test(file) || /(^|\/)vitest\.benchmark\.config\.[cm]?[jt]s$/.test(file);
}
function artifactName(kind, number, run) { return `${kind}-pr-${number}-${run.id}-${run.run_attempt || 1}`; }
function correctArtifact(manifest, sha, run) {
  return manifest?.schemaVersion === 1 && manifest.headSha === sha && String(manifest.runId) === String(run.id)
    && String(manifest.runAttempt) === String(run.run_attempt || 1) && Array.isArray(manifest.checks);
}
module.exports = { WORKFLOWS, selectProjects, latestRun, classify, aggregate, protectedFile, artifactName, correctArtifact };
