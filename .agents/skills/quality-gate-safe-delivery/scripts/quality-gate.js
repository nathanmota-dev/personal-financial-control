#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const C = require("./config.js");
const { scanSources } = require("./source-scan.js");

function aggregate(projects) {
  return Object.fromEntries(C.METRICS.map((metric) => [metric, Object.values(projects).reduce((total, project) => ({
    covered: total.covered + project.coverage[metric].covered, total: total.total + project.coverage[metric].total,
  }), { covered: 0, total: 0 })]));
}
function parseCoverage(summary, root, project, files) {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) throw new C.InputError("Invalid coverage summary.");
  const totals = Object.fromEntries(C.METRICS.map((key) => [key, C.ratio(summary.total?.[key], `${project.name}.${key}`)]));
  const expected = Object.keys(files).filter((file) => !C.DECLARATION_PATTERN.test(file)).sort();
  const actual = [], sums = Object.fromEntries(C.METRICS.map((key) => [key, { covered: 0, total: 0 }]));
  for (const [reported, metrics] of Object.entries(summary)) {
    if (reported === "total") continue;
    const portable = reported.replaceAll("\\", "/");
    const prefix = project.directory === "." ? "" : `${project.directory}/`;
    const absolute = path.isAbsolute(portable) ? path.normalize(portable)
      : path.resolve(root, portable.startsWith(prefix) && prefix ? portable : path.join(project.directory, portable));
    const file = C.relative(root, absolute);
    if (!expected.includes(file) || actual.includes(file)) throw new C.InputError(`Unexpected or duplicate coverage path: ${reported}`);
    actual.push(file);
    for (const key of C.METRICS) {
      const value = C.ratio(metrics?.[key], `${file}.${key}`);
      sums[key].covered += value.covered; sums[key].total += value.total;
    }
  }
  const missing = expected.filter((file) => !actual.includes(file));
  if (missing.length) throw new C.InputError(`Coverage scope mismatch for ${project.name}: missing ${missing.join(", ")}`);
  for (const key of C.METRICS) {
    if (sums[key].covered !== totals[key].covered || sums[key].total !== totals[key].total) throw new C.InputError(`Coverage totals disagree with files: ${project.name}.${key}`);
  }
  return { coverage: totals, coverageFileCount: actual.length };
}
function parseEslint(report) {
  if (!Array.isArray(report)) throw new C.InputError("ESLint report must be an array.");
  return report.reduce((sum, item) => sum + C.count(item.errorCount, "ESLint errors") + C.count(item.warningCount, "ESLint warnings"), 0);
}
function parseDuplication(report) {
  const stats = report?.statistics?.total ?? report?.statistic?.total;
  if (!stats) throw new C.InputError("Missing JSCPD totals.");
  const totalLines = C.count(stats.lines, "JSCPD lines"), duplicatedLines = C.count(stats.duplicatedLines, "JSCPD duplicates");
  const fragments = C.count(stats.clones ?? report.duplicates?.length, "JSCPD fragments");
  if (duplicatedLines > totalLines) throw new C.InputError("Duplicated lines exceed scanned lines.");
  const percentage = totalLines ? duplicatedLines / totalLines * 100 : 0;
  if (Math.abs(C.finite(stats.percentage, "JSCPD percentage") - percentage) > 0.02) throw new C.InputError("Inconsistent JSCPD percentage.");
  return { totalLines, duplicatedLines, fragments };
}
function collectDuplication(root, sourceRoots, key) {
  const output = C.inside(root, `reports/jscpd/${key}`);
  fs.mkdirSync(output, { recursive: true });
  const binary = path.join(__dirname, "node_modules", ".bin", process.platform === "win32" ? "jscpd.cmd" : "jscpd");
  const policy = C.POLICY.duplication;
  const result = C.execute([binary, ...sourceRoots,
    "--min-lines", String(policy.minLines), "--min-tokens", String(policy.minTokens),
    "--max-lines", String(policy.maxLines), "--mode", policy.mode, "--cross-formats", policy.crossFormats,
    "--ignore", "**/__tests__/**,**/test/**,**/tests/**,**/*.test.*,**/*.spec.*,**/*.d.ts,**/*.d.mts,**/*.d.cts,**/node_modules/**,**/coverage/**,**/dist/**",
    "--reporters", "json,html", "--output", output, "--threshold", "100", "--no-colors", "--no-tips"], root);
  fs.writeFileSync(path.join(output, "console.txt"), result.stdout + result.stderr);
  if (result.status !== 0) throw new C.InputError(`JSCPD failed for ${key}: ${result.stderr || result.stdout}`);
}
function collect(root, config, collectTools = true) {
  const projects = {}, seenFiles = new Set();
  for (const project of config.projects) {
    const scan = scanSources(root, project);
    if (Object.keys(scan.files).some((file) => /\.[cm]?tsx?$/.test(file)) && !project.commands.typecheck) throw new C.InputError(`Missing TypeScript typecheck command for ${project.name}.`);
    for (const file of Object.keys(scan.files)) {
      if (seenFiles.has(file)) throw new C.InputError(`Source file belongs to multiple projects: ${file}`);
      seenFiles.add(file);
    }
    const lintPath = C.inside(root, `reports/eslint/${project.name}.json`);
    if (collectTools) {
      const lint = C.execute(["npm", "exec", "--no", "--", "eslint", ".", "--format", "json", ...C.toolIgnoreArgs(project)], C.inside(root, project.directory));
      if (![0, 1].includes(lint.status)) throw new C.InputError(`ESLint collection failed: ${project.name}: ${lint.stderr}`);
      let report;
      try { report = JSON.parse(lint.stdout); } catch { throw new C.InputError(`Malformed ESLint output: ${project.name}`); }
      C.writeJson(lintPath, report);
      collectDuplication(root, project.sourceRoots, project.name);
    }
    const coverage = parseCoverage(C.readJson(C.inside(root, project.coveragePath)), root, project, scan.files);
    const duplication = parseDuplication(C.readJson(C.inside(root, `reports/jscpd/${project.name}/jscpd-report.json`)));
    projects[project.name] = { ...coverage, duplication, lintViolations: parseEslint(C.readJson(lintPath)), ...scan };
  }
  if (collectTools) collectDuplication(root, config.projects.flatMap((project) => project.sourceRoots), "all");
  return { projects, coverage: aggregate(projects), duplication: parseDuplication(C.readJson(C.inside(root, "reports/jscpd/all/jscpd-report.json"))) };
}
function validateBaseline(baseline, config) {
  if (baseline?.schemaVersion !== 1 || !baseline.projects || typeof baseline.projects !== "object") throw new C.InputError("Invalid quality baseline schema.");
  if (!require("node:util").isDeepStrictEqual(baseline.policy, C.POLICY)) throw new C.InputError("Quality baseline policy differs from protected defaults.");
  if (Object.keys(baseline.projects).sort().join() !== config.projects.map((p) => p.name).sort().join()) throw new C.InputError("Baseline project set differs from configuration.");
  for (const [name, project] of Object.entries(baseline.projects)) {
    for (const metric of C.METRICS) C.ratio(project.coverage?.[metric], `${name}.${metric}`);
    validateDuplication(project.duplication);
    C.count(project.lintViolations, `${name}.lintViolations`);
    if (!project.files || Array.isArray(project.files) || !Array.isArray(project.functions)) throw new C.InputError("Missing baseline source details.");
    for (const [file, lines] of Object.entries(project.files)) C.count(lines, file);
    for (const item of project.functions) C.count(item.lines, "function lines");
  }
  validateDuplication(baseline.duplication);
  return baseline;
}
function validateDuplication(value) {
  if (!value) throw new C.InputError("Missing duplication metrics.");
  for (const key of ["totalLines", "duplicatedLines", "fragments"]) C.count(value[key], key);
  if (value.duplicatedLines > value.totalLines) throw new C.InputError("Invalid duplication ratio.");
}
function compareDuplication(current, baseline, label, failures) {
  if ((baseline.totalLines > 0 && current.totalLines === 0) ||
    current.duplicatedLines * baseline.totalLines > baseline.duplicatedLines * current.totalLines ||
    (baseline.totalLines === 0 && current.duplicatedLines > 0)) failures.push(`${label}: duplication increased or the scan became empty.`);
  if (current.fragments > baseline.fragments) failures.push(`${label}: duplicate fragments increased.`);
}
function compare(baseline, current) {
  const failures = [];
  for (const [name, project] of Object.entries(current.projects)) {
    for (const metric of C.METRICS) {
      const value = project.coverage[metric];
      if (value.covered * 100 < C.POLICY.minimumCoverage * value.total) failures.push(`${name}: ${metric} coverage below 80%.`);
      if (baseline && C.lower(value, baseline.projects[name].coverage[metric])) failures.push(`${name}: ${metric} coverage decreased.`);
    }
    if (project.lintViolations) failures.push(`${name}: ${project.lintViolations} lint error(s)/warning(s).`);
    for (const [file, lines] of Object.entries(project.files)) if (lines > 350) failures.push(`${file}: ${lines} lines exceeds 350.`);
    for (const fn of project.functions) if (fn.lines > 100) failures.push(`${fn.file}:${fn.startLine} ${fn.name}: ${fn.lines} lines exceeds 100.`);
    if (baseline) compareDuplication(project.duplication, baseline.projects[name].duplication, name, failures);
  }
  if (baseline) {
    const total = aggregate(baseline.projects);
    for (const metric of C.METRICS) if (C.lower(current.coverage[metric], total[metric])) failures.push(`Total ${metric} coverage decreased.`);
    compareDuplication(current.duplication, baseline.duplication, "All projects", failures);
  }
  return { passed: failures.length === 0, failures };
}
function coverageTable(title, current, baseline) {
  const lines = [`## ${C.escape(title)}`, "", "| Metric | Baseline | Current | Change |", "|---|---:|---:|---:|"];
  for (const metric of C.METRICS) {
    const value = C.percentage(current[metric]), old = baseline ? C.percentage(baseline[metric]) : null;
    const display = (count) => count.total ? `${C.percentage(count).toFixed(2)}%` : "No executable items";
    lines.push(`| ${metric} | ${baseline ? display(baseline[metric]) : "No baseline"} | ${display(current[metric])} | ${old === null || !current[metric].total || !baseline[metric].total ? "—" : `${value - old >= 0 ? "+" : ""}${(value - old).toFixed(2)} pp`} |`);
  }
  return lines;
}
function render({ metrics, baseline, comparison, label, bootstrap }) {
  const lines = ["# Quality Gate", "", `**${comparison.passed ? bootstrap ? "BOOTSTRAP" : "PASS" : "FAIL"}** — ${bootstrap ? "Initial measurements; no historical comparison. Absolute policies still apply." : comparison.passed ? "No quality regression detected." : "Blocking quality checks failed."}`, "", `Baseline: \`${C.escape(label)}\``, "", ...coverageTable("Weighted coverage", metrics.coverage, baseline && aggregate(baseline.projects))];
  for (const [name, project] of Object.entries(metrics.projects)) {
    const old = baseline?.projects[name];
    lines.push("", ...coverageTable(`${name} coverage`, project.coverage, old?.coverage), "", `## ${C.escape(name)} maintainability`, "",
      "| Metric | Baseline | Current | Change |", "|---|---:|---:|---:|");
    const values = (p) => p && ({ Duplication: p.duplication.totalLines ? p.duplication.duplicatedLines / p.duplication.totalLines * 100 : 0,
      "Duplicate fragments": p.duplication.fragments, "ESLint violations": p.lintViolations,
      "Oversized files (> 350 lines)": Object.values(p.files).filter((v) => v > 350).length,
      "Large functions (> 100 lines)": p.functions.filter((f) => f.lines > 100).length });
    for (const [key, value] of Object.entries(values(project))) {
      const previous = values(old)?.[key], percent = key === "Duplication";
      const format = (v) => percent ? `${v.toFixed(2)}%` : String(v);
      lines.push(`| ${key} | ${previous === undefined ? "No baseline" : format(previous)} | ${format(value)} | ${previous === undefined ? "—" : `${value - previous >= 0 ? "+" : ""}${percent ? (value - previous).toFixed(2) + " pp" : value - previous}`} |`);
    }
    lines.push("", `- Production files: ${Object.keys(project.files).length}; coverage files: ${project.coverageFileCount}.`,
      `- JSCPD: ${project.duplication.duplicatedLines} duplicated / ${project.duplication.totalLines} scanned lines.`);
  }
  const duplicateValues = (value) => ({ "Percentage (%)": value.totalLines ? value.duplicatedLines / value.totalLines * 100 : 0, Fragments: value.fragments });
  lines.push("", "## Combined duplication", "", "| Metric | Baseline | Current | Change |", "|---|---:|---:|---:|");
  for (const [key, value] of Object.entries(duplicateValues(metrics.duplication))) {
    const old = baseline ? duplicateValues(baseline.duplication)[key] : undefined;
    lines.push(`| ${key} | ${old === undefined ? "No baseline" : old.toFixed(2)} | ${value.toFixed(2)} | ${old === undefined ? "—" : `${value - old >= 0 ? "+" : ""}${(value - old).toFixed(2)}`} |`);
  }
  lines.push("", `- Combined scan: ${metrics.duplication.duplicatedLines} duplicated / ${metrics.duplication.totalLines} scanned lines.`);
  if (comparison.failures.length) lines.push("", "## Failures", "", ...comparison.failures.map((v) => `- ${C.escape(v)}`));
  return lines.join("\n") + "\n";
}
function runCli(args = process.argv.slice(2)) {
  let root = process.cwd();
  try {
    const options = C.argumentsFor(args); root = options.root;
    if (options["update-baseline"] && process.env.CI === "true") throw new C.InputError("Baseline updates are disabled in CI.");
    const config = C.loadConfig(options), baselinePath = options.baseline || process.env.QUALITY_GATE_BASELINE_PATH || "scripts/baseline.json";
    const absolute = path.resolve(root, baselinePath), bootstrap = Boolean(options.bootstrap);
    const baseline = !bootstrap && fs.existsSync(absolute) ? validateBaseline(C.readJson(absolute), config) : null;
    if (!baseline && !bootstrap && !options["update-baseline"]) throw new C.InputError("Quality baseline missing. Use bootstrap for the initial measurement.");
    const metrics = collect(root, config, !options["no-collect"]), comparison = compare(baseline, metrics);
    const candidate = { schemaVersion: 1, policy: C.POLICY, ...metrics, ...C.provenance() };
    C.writeJson(C.inside(root, "reports/candidate-baseline.json"), candidate);
    if (options["update-baseline"]) {
      if (!comparison.passed) throw new C.InputError("Cannot promote a failing baseline.");
      C.writeJson(absolute, candidate);
    }
    const label = process.env.QUALITY_GATE_BASELINE_LABEL || (bootstrap ? "bootstrap" : baselinePath);
    const markdown = render({ metrics, baseline, comparison, label, bootstrap });
    fs.writeFileSync(C.inside(root, "reports/quality-gate.md"), markdown);
    C.writeJson(C.inside(root, "reports/quality-gate.json"), { schemaVersion: 1, status: comparison.passed ? bootstrap ? "bootstrap" : "pass" : "fail", baseline: label, metrics, comparison, ...C.provenance() });
    process.stdout.write(markdown);
    return comparison.passed ? 0 : 1;
  } catch (error) { C.failureReport(root, "quality-gate", error); process.stderr.write(error.message + "\n"); return 2; }
}
module.exports = { aggregate, parseCoverage, parseEslint, parseDuplication, collect, compare, compareDuplication, validateBaseline, render, runCli };
if (require.main === module) process.exitCode = runCli();
