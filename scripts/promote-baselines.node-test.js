"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const Promote = require("./promote-baselines.js"), C = require("./config.js"), H = require("./test-helpers.js"), B = require("./benchmark-gate.js");
function performanceFixture(hz = 101) {
  const sha = "b".repeat(40), baseline = { schemaVersion: 1, policy: { maxRegressionPercent: 20 }, headSha: "a".repeat(40), projects: { app: B.extract(H.rawBench(), "app") } };
  const candidate = { ...baseline, headSha: sha, projects: { app: B.extract(H.rawBench(hz), "app") } };
  const report = { ...C.provenance(), evidence: { headSha: sha, referenceSha: baseline.headSha, pairs: 3, runner: { cpu: "same" }, runtime: { node: "same" }, runs: {} } };
  for (const side of ["reference", "current"]) report.evidence.runs[side] = [1, 2, 3].map((pair) => ({ ...C.provenance(), headSha: sha, pair, commit: side === "reference" ? baseline.headSha : sha, runner: report.evidence.runner, runtime: report.evidence.runtime, projects: side === "reference" ? baseline.projects : candidate.projects }));
  return { sha, baseline, candidate, report };
}
test("quality reference advances only for improvements without coverage, duplication or size losses", (t) => {
  const root = H.temporary(t), baseline = { schemaVersion: 1, policy: C.POLICY, ...H.metrics(root) }, config = H.config();
  assert.equal(Promote.qualityEligibility(baseline, baseline, config).eligible, false);
  const better = structuredClone(baseline); better.projects.app.coverage = H.coverage(9, 10);
  assert.equal(Promote.qualityEligibility(baseline, better, config).eligible, true);
  for (const mutate of [
    (p) => p.coverage.branches.covered = 7,
    (p) => p.duplication.fragments++,
    (p) => p.files["src/index.js"]++,
    (p) => p.functions[0].lines++,
  ]) {
    const current = structuredClone(better); mutate(current.projects.app);
    assert.equal(Promote.qualityEligibility(baseline, current, config).eligible, false);
  }
  const smaller = structuredClone(baseline); smaller.projects.app.files["src/index.js"]--;
  assert.equal(Promote.qualityEligibility(baseline, smaller, config).eligible, true);
});
test("20% tolerated throughput loss can pass PR validation but cannot be promoted", () => {
  for (const hz of [80, 99, 100, 101]) {
    const f = performanceFixture(hz);
    assert.equal(B.compare(f.baseline, f.candidate, ["app"]).passed, true);
    assert.equal(Promote.performanceEligibility(f.baseline, f.candidate, f.report, ["app"], f.sha).eligible, hz > 100);
  }
});
test("one performance improvement never masks a loss in another scenario", () => {
  const f = performanceFixture(110), baselineBenchmarks = f.baseline.projects.app.benchmarks;
  baselineBenchmarks.other = H.stats(100); f.candidate.projects.app.benchmarks.other = H.stats(99);
  assert.equal(B.compare(f.baseline, f.candidate, ["app"]).passed, true);
  assert.equal(Promote.performanceEligibility(f.baseline, f.candidate, f.report, ["app"], f.sha).eligible, false);
});
test("promotion rejects partial pairs, different machines, runtime/attempt mismatch and forged medians", () => {
  for (const mutate of [
    (f) => f.report.evidence.runs.current.pop(),
    (f) => f.report.evidence.runs.current[0].runner = { cpu: "other" },
    (f) => f.report.evidence.runs.reference[0].runtime = { node: "other" },
    (f) => f.report.evidence.runs.current[0].runAttempt = "999",
    (f) => f.report.evidence.runs.current[1].pair = 1,
    (f) => Object.values(f.candidate.projects.app.benchmarks)[0].hz++,
  ]) {
    const f = performanceFixture(); // Clone so mutating the candidate cannot rewrite evidence.
    f.report = structuredClone(f.report); mutate(f);
    assert.throws(() => Promote.performanceEligibility(f.baseline, f.candidate, f.report, ["app"], f.sha));
  }
});
function promotionFixture(t, options = {}) {
  const root = H.temporary(t), f = performanceFixture(options.hz), config = H.config();
  const baseline = { schemaVersion: 1, policy: C.POLICY, ...H.metrics(root) };
  const quality = { ...structuredClone(baseline), ...C.provenance(), headSha: f.sha };
  if (!options.noQualityImprovement) quality.projects.app.coverage = H.coverage(9, 10);
  H.write(root, "scripts/baseline.json", baseline); H.write(root, "scripts/benchmark-baseline.json", f.baseline);
  H.write(root, "reports/candidate-baseline.json", quality); H.write(root, "reports/benchmark-candidate-baseline.json", { ...f.candidate, ...C.provenance(), headSha: f.sha });
  for (const kind of ["quality", "performance"]) {
    H.write(root, `reports/${kind}-workflow.json`, { schemaVersion: 1, ...C.provenance(), headSha: f.sha, overall: "PASS", checks: [{ name: "required", outcome: options.failedValidation ? "failure" : "success", selected: true, blocking: true }] });
    H.write(root, `reports/${kind === "quality" ? "quality-gate" : "performance"}.json`, { schemaVersion: 1, ...C.provenance(), headSha: f.sha, status: "pass", ...kind === "performance" ? { evidence: f.report.evidence } : {} });
  }
  const calls = []; let pushed = false;
  const execute = (args) => {
    calls.push(args);
    let stdout = "";
    if (args[1] === "rev-parse") stdout = args[2] === "origin/main" && (options.advanced || pushed) ? "c".repeat(40) : f.sha;
    if (args[1] === "push") { pushed = true; return { status: options.pushRace ? 1 : 0, stdout: "", stderr: "race" }; }
    return { status: 0, stdout: stdout + (stdout ? "\n" : ""), stderr: "" };
  };
  return { root, f, config, calls, execute };
}
test("promotion writes only eligible files and never changes the local baseline", (t) => {
  const x = promotionFixture(t, { hz: 99 }); H.write(x.root, "scripts/benchmark-baseline.local.json", "local reference");
  const original = fs.readFileSync(path.join(x.root, "scripts/benchmark-baseline.json"), "utf8");
  const result = Promote.promote(x.root, x.config, x.f.sha, x.execute);
  assert.deepEqual(result.files, ["scripts/baseline.json"]);
  assert.equal(fs.readFileSync(path.join(x.root, "scripts/benchmark-baseline.json"), "utf8"), original);
  assert.equal(fs.readFileSync(path.join(x.root, "scripts/benchmark-baseline.local.json"), "utf8"), "local reference");
  assert.ok(x.calls.some((args) => args.includes("[baseline-promotion]")));
});
test("no improvement produces no commit; failed required validation blocks promotion", (t) => {
  const x = promotionFixture(t, { hz: 100, noQualityImprovement: true });
  assert.equal(Promote.promote(x.root, x.config, x.f.sha, x.execute).status, "unchanged");
  assert.ok(!x.calls.some((args) => args.includes("commit") || args[1] === "push"));
  const bad = promotionFixture(t, { failedValidation: true });
  assert.throws(() => Promote.promote(bad.root, bad.config, bad.f.sha, bad.execute), /validation failed/);
});
test("main advancing before mutation or during push discards promotion without force", (t) => {
  for (const options of [{ advanced: true }, { pushRace: true }]) {
    const x = promotionFixture(t, options), original = fs.readFileSync(path.join(x.root, "scripts/baseline.json"), "utf8");
    assert.equal(Promote.promote(x.root, x.config, x.f.sha, x.execute).status, "discarded");
    assert.ok(!x.calls.some((args) => args.some((value) => value.startsWith("--force"))));
    if (options.advanced) assert.equal(fs.readFileSync(path.join(x.root, "scripts/baseline.json"), "utf8"), original);
  }
});
test("promotion workflow validates main before writing and prevents recursive baseline runs", () => {
  const workflow = require("yaml").parse(fs.readFileSync(path.join(__dirname, "../.github/workflows/promote-baselines.yml"), "utf8"));
  assert.deepEqual(workflow.on.push.branches, ["main"]);
  assert.deepEqual(workflow.on.push["paths-ignore"], ["scripts/baseline.json", "scripts/benchmark-baseline.json"]);
  const job = workflow.jobs["validate-and-promote"];
  assert.match(job.if, /baseline-promotion/);
  const steps = job.steps;
  assert.ok(steps.findIndex((step) => step.id === "quality") < steps.findIndex((step) => step.id === "performance"));
  assert.match(steps.find((step) => step.name === "Promote only eligible improvements").if, /success\(\).*quality.outcome.*performance.outcome/);
  assert.equal(steps.find((step) => step.uses === "actions/checkout@v5").with["persist-credentials"], false);
  const publisher = fs.readFileSync(path.join(__dirname, "../.github/workflows/pr-validation.yml"), "utf8");
  assert.match(publisher, /result\?\.state === 'FAIL'.*core.setFailed/);
});
