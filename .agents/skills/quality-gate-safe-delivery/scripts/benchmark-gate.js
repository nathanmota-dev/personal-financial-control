#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const C = require("./config.js");

function statistics(value, label) {
  const result = {};
  for (const key of ["hz", "mean", "median", "rme", "sampleCount"]) result[key] = C.finite(value?.[key], `${label}.${key}`, key !== "rme");
  if (!Number.isSafeInteger(result.sampleCount)) throw new C.InputError(`Invalid ${label}.sampleCount.`);
  return result;
}
function extract(raw, project) {
  if (!Array.isArray(raw?.files)) throw new C.InputError(`Missing benchmark files: ${project}`);
  const benchmarks = {};
  for (const file of raw.files) {
    if (!Array.isArray(file.groups)) throw new C.InputError("Invalid benchmark groups.");
    for (const group of file.groups) {
      if (typeof group.fullName !== "string" || !group.fullName || !Array.isArray(group.benchmarks)) throw new C.InputError("Invalid benchmark group.");
      for (const item of group.benchmarks) {
        if (typeof item.name !== "string" || !item.name) throw new C.InputError("Unnamed benchmark.");
        const key = `${group.fullName} > ${item.name}`;
        if (Object.hasOwn(benchmarks, key)) throw new C.InputError(`Duplicate benchmark: ${key}`);
        benchmarks[key] = statistics(item, key);
      }
    }
  }
  if (!Object.keys(benchmarks).length) throw new C.InputError(`No benchmarks in ${project}.`);
  return { benchmarks };
}
function validateBaseline(baseline, names) {
  if (baseline?.schemaVersion !== 1 || baseline.policy?.maxRegressionPercent !== 20 || !baseline.projects) throw new C.InputError("Invalid benchmark baseline or protected regression limit.");
  if (Object.keys(baseline.projects).sort().join() !== [...names].sort().join()) throw new C.InputError("Benchmark baseline project set mismatch.");
  for (const [name, project] of Object.entries(baseline.projects)) {
    if (!project.benchmarks || !Object.keys(project.benchmarks).length) throw new C.InputError(`Empty benchmark baseline: ${name}`);
    for (const [key, value] of Object.entries(project.benchmarks)) statistics(value, `${name}/${key}`);
  }
  return baseline;
}
function compare(baseline, current, names) {
  const results = [], failures = [], warnings = [];
  for (const name of names) {
    const old = baseline?.projects[name]?.benchmarks || {}, measured = current.projects[name].benchmarks;
    for (const [key, previous] of Object.entries(old)) {
      const value = measured[key];
      if (!value) {
        failures.push(`${name}/${key} is missing.`);
        results.push({ project: name, key, baseline: previous, current: null, status: "MISSING", change: null });
        continue;
      }
      const change = (value.hz - previous.hz) / previous.hz * 100;
      // Compare throughput directly: avoid floating-point rounding at exactly 20%.
      const regressed = value.hz < previous.hz * 0.8;
      if (regressed) failures.push(`${name}/${key} regressed by ${Math.abs(change).toFixed(2)}%.`);
      results.push({ project: name, key, baseline: previous, current: value, status: regressed ? "REGRESSION" : "PASS", change });
    }
    for (const [key, value] of Object.entries(measured)) if (!Object.hasOwn(old, key)) {
      if (baseline) warnings.push(`${name}/${key} is new and has no trusted reference.`);
      results.push({ project: name, key, baseline: null, current: value, status: baseline ? "NEW" : "BOOTSTRAP", change: null });
    }
  }
  return { passed: !failures.length, results, failures, warnings };
}
function render(baseline, comparison, selected, all, label) {
  const number = (value) => value == null ? "—" : value.toFixed(2);
  const lines = ["# Performance", "", `**${comparison.passed ? baseline ? "PASS" : "BOOTSTRAP" : "FAIL"}** — ${baseline ? "Throughput loss greater than 20% blocks delivery." : "Initial measurements; no historical speed comparison."}`, "",
    `Baseline: \`${C.escape(label)}\` · limit: 20% throughput loss.`, "",
    "| Project | Benchmark | Baseline ops/s | Current ops/s | Change | RME | Samples | Result |",
    "|---|---|---:|---:|---:|---:|---:|---|"];
  for (const result of comparison.results) lines.push(`| ${C.escape(result.project)} | ${C.escape(result.key)} | ${number(result.baseline?.hz)} | ${number(result.current?.hz)} | ${result.change === null ? "—" : `${result.change >= 0 ? "+" : ""}${number(result.change)}%`} | ${result.current ? number(result.current.rme) + "%" : "—"} | ${result.current?.sampleCount ?? "—"} | ${result.status} |`);
  if (!selected.length) lines.push("| — | No benchmark-relevant package changed | — | — | — | — | — | SKIPPED |");
  for (const [heading, items] of [["Failures", comparison.failures], ["Warnings", comparison.warnings]]) if (items.length) lines.push("", `## ${heading}`, "", ...items.map((item) => `- ${C.escape(item)}`));
  lines.push("", `Selected projects: ${selected.join(", ") || "none"}.`, `Skipped projects: ${all.filter((name) => !selected.includes(name)).join(", ") || "none"}.`);
  return lines.join("\n") + "\n";
}
function runCli(args = process.argv.slice(2)) {
  let root = process.cwd();
  try {
    const options = C.argumentsFor(args); root = options.root;
    const config = C.loadConfig(options), all = config.projects.map((p) => p.name);
    const selected = options.projects === undefined ? all : [...new Set(options.projects.split(",").filter(Boolean))];
    if (selected.some((name) => !all.includes(name))) throw new C.InputError("Unknown selected benchmark project.");
    if (options["update-baseline"] && (process.env.CI === "true" || selected.length !== all.length)) throw new C.InputError("Baseline updates require all projects and are disabled in CI.");
    const baselinePath = options.baseline || process.env.BENCHMARK_BASELINE_PATH || "scripts/benchmark-baseline.json";
    const absolute = path.resolve(root, baselinePath);
    const baseline = !options.bootstrap && fs.existsSync(absolute) ? validateBaseline(C.readJson(absolute), all) : null;
    if (!baseline && !options.bootstrap && !options["update-baseline"]) throw new C.InputError("Benchmark baseline missing. Use bootstrap for the initial measurement.");
    const projects = Object.fromEntries(selected.map((name) => {
      const project = config.projects.find((p) => p.name === name);
      return [name, extract(C.readJson(C.inside(root, project.benchmarkPath)), name)];
    }));
    const current = { schemaVersion: 1, policy: { maxRegressionPercent: 20 }, projects, runtime: { node: process.version, platform: process.platform, arch: process.arch }, ...C.provenance() };
    const comparison = compare(baseline, current, selected);
    C.writeJson(C.inside(root, "reports/benchmark-current.json"), current);
    const candidate = { ...current, projects: { ...baseline?.projects, ...projects } };
    C.writeJson(C.inside(root, "reports/benchmark-candidate-baseline.json"), candidate);
    if (options["update-baseline"]) {
      if (!comparison.passed) throw new C.InputError("Cannot promote a regressed reference.");
      C.writeJson(absolute, candidate);
    }
    const label = process.env.BENCHMARK_BASELINE_LABEL || (options.bootstrap ? "bootstrap" : baselinePath);
    fs.writeFileSync(C.inside(root, "reports/performance.md"), render(baseline, comparison, selected, all, label));
    C.writeJson(C.inside(root, "reports/performance.json"), { schemaVersion: 1, status: comparison.passed ? baseline ? "pass" : "bootstrap" : "fail", comparison, current, baseline: label, ...C.provenance() });
    return comparison.passed ? 0 : 1;
  } catch (error) { C.failureReport(root, "performance", error); process.stderr.write(error.message + "\n"); return 2; }
}
module.exports = { statistics, extract, validateBaseline, compare, render, runCli };
if (require.main === module) process.exitCode = runCli();
