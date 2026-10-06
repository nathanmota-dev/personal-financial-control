#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const C = require("./config.js");
const W = require("./workflow-report.js");
const MARKER = "<!-- quality-gate-safe-delivery-pr-report -->";

function compactDetail(detail) {
  const metadata = [
    /^## Validation infrastructure review$/,
    /^\*\*WARNING\*\* — CI maintenance paths changed:/,
    /^This is the metric comparison result\./,
    /^Existing coverage and size debt is accepted only at the reviewed reference;/,
    /^Absolute policies apply\.$/,
    /^Baseline: /,
    /^Reference commit: /,
  ];
  return detail.trim().replaceAll("\r\n", "\n").split(/\n\s*\n/)
    .filter((paragraph) => !metadata.some((pattern) => pattern.test(paragraph)))
    .join("\n\n").replace(/^# (Quality Gate|Performance)$/m, "## $1");
}

function render({ workflows = [], details = [] }) {
  const lines = [MARKER, "# Quality and performance report", "", "## Workflow checks", ""];
  const display = (workflow) => workflow.name === "PR Quality Gate" ? "Quality Gate" : workflow.name;
  for (const workflow of workflows) lines.push(`- ${C.escape(display(workflow))} overall: **${workflow.state}**.`);
  lines.push("", "| Workflow | Check | Result | Selected | Blocking |", "|---|---|---|---|---|");
  for (const workflow of workflows) {
    lines.push(`| ${C.escape(display(workflow))} | Workflow conclusion | ${workflow.state} | Yes | Yes |`);
    for (const raw of workflow.manifest?.checks || []) {
      const check = W.normalize(raw);
      lines.push(`| ${C.escape(display(workflow))} | ${C.escape(check.name)} | ${check.result} | ${check.selected ? "Yes" : "No"} | ${check.blocking ? "Yes" : "No (warning)"} |`);
    }
  }
  lines.push("");
  for (const workflow of workflows) {
    for (const check of workflow.manifest?.checks || []) if (check.details?.length && check.name !== "Validation infrastructure review") lines.push(`### ${C.escape(display(workflow))}: ${C.escape(check.name)}`, "", ...check.details.map((detail) => `- ${C.escape(detail)}`), "");
  }
  for (const detail of details) {
    const compact = compactDetail(detail);
    if (compact) lines.push("", compact);
  }
  const text = lines.join("\n").replace(/\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?/gu, "");
  if (text.length <= 60000) return text + "\n";
  return text.slice(0, 59000) + "\n\nReport truncated; full diagnostics are available in the workflow artifacts.\n";
}
function runCli(args = process.argv.slice(2)) {
  try {
    const options = C.argumentsFor(args, ["--input", "--output"]);
    if (!options.input) throw new C.InputError("--input requires a consolidated report JSON file.");
    const output = C.inside(options.root, options.output || "reports/pr-report.md");
    fs.mkdirSync(require("node:path").dirname(output), { recursive: true });
    fs.writeFileSync(output, render(C.readJson(require("node:path").resolve(options.root, options.input))));
    return 0;
  } catch (error) { process.stderr.write(error.message + "\n"); return 2; }
}
module.exports = { MARKER, render, runCli };
if (require.main === module) process.exitCode = runCli();
