"use strict";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const C = require("./config.js");
const { scanSources } = require("./source-scan.js");
function temporary(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "quality-skill-test-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function write(root, file, contents) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), typeof contents === "string" ? contents : JSON.stringify(contents, null, 2));
}
function project(name = "app", directory = ".") {
  const prefix = directory === "." ? "" : directory + "/";
  return { name, directory, sourceRoots: [`${prefix}src`], coveragePath: `${prefix}coverage/coverage-summary.json`, benchmarkPath: `reports/benchmarks/${name}.json`,
    commands: { lint: ["npm", "run", "lint"], coverage: ["npm", "run", "test:coverage:ci"], benchmark: ["npm", "run", "benchmark"] } };
}
function config(projects = [project()]) { return { schemaVersion: 1, setupVersion: 1, mode: "managed", projects, policy: C.POLICY }; }
function coverage(covered = 8, total = 10) { return Object.fromEntries(C.METRICS.map((key) => [key, { covered, total }])); }
function duplication(duplicatedLines = 0, totalLines = 100, fragments = 0) { return { duplicatedLines, totalLines, fragments }; }
function duplicationReport(value = duplication()) {
  return { statistics: { total: { lines: value.totalLines, duplicatedLines: value.duplicatedLines, clones: value.fragments, percentage: value.totalLines ? value.duplicatedLines / value.totalLines * 100 : 0 } } };
}
function metrics(root, projects = [project()]) {
  const packages = {};
  for (const p of projects) {
    write(root, `${p.sourceRoots[0]}/index.js`, "export function work() {\n  return 1;\n}\n");
    packages[p.name] = { coverage: coverage(), coverageFileCount: 1, duplication: duplication(), lintViolations: 0, ...scanSources(root, p) };
  }
  return { projects: packages, duplication: duplication(), coverage: require("./quality-gate.js").aggregate(packages) };
}
function inputs(root) {
  const p = project(), measured = metrics(root);
  write(root, "scripts/quality-gate.config.json", config());
  write(root, p.coveragePath, { total: coverage(), [path.join(root, "src/index.js")]: coverage() });
  write(root, "reports/eslint/app.json", [{ errorCount: 0, warningCount: 0 }]);
  for (const key of ["app", "all"]) write(root, `reports/jscpd/${key}/jscpd-report.json`, duplicationReport());
  return measured;
}
function stats(hz = 100) { return { hz, mean: 1000 / hz, median: 1000 / hz, rme: 1, sampleCount: 100 }; }
function rawBench(hz = 100) { return { files: [{ groups: [{ fullName: "benchmarks/work.bench.ts > work", benchmarks: [{ name: "normal case", ...stats(hz) }] }] }] }; }
function cli(file, root, args = [], additions = {}) {
  const env = { ...process.env, ...additions };
  for (const key of ["QUALITY_GATE_CONFIG_PATH", "QUALITY_GATE_BASELINE_PATH", "BENCHMARK_BASELINE_PATH", "QUALITY_GATE_BASELINE_LABEL", "BENCHMARK_BASELINE_LABEL", "PR_BASE_SHA", "PR_HEAD_SHA"]) delete env[key];
  return C.execute([process.execPath, path.join(__dirname, file), "--root", root, ...args], root, { env });
}
module.exports = { temporary, write, project, config, coverage, duplication, duplicationReport, metrics, inputs, stats, rawBench, cli };
