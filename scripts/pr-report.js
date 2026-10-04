#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const C = require("./config.js");
const W = require("./workflow-report.js");
const MARKER = "<!-- quality-gate-safe-delivery-pr-report -->";

function render({ number, sha, state, workflows = [], details = [] }) {
  const lines = [MARKER, "# Quality and performance report", "", `**${state}** · PR #${number} · commit \`${C.escape(sha.slice(0, 12))}\``, "", "## Workflow checks", ""];
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
    if (workflow.metricStatus) lines.push(`${C.escape(display(workflow))} metric comparison: **${workflow.metricStatus.toUpperCase()}**; overall: **${workflow.state}**.`, "");
    for (const check of workflow.manifest?.checks || []) if (check.details?.length) lines.push(`### ${C.escape(display(workflow))}: ${C.escape(check.name)}`, "", ...check.details.map((detail) => `- ${C.escape(detail)}`), "");
  }
  for (const workflow of workflows) if (workflow.url) lines.push(`[${C.escape(display(workflow))} run](${workflow.url})`, "");
  for (const detail of details) lines.push("", detail.trim().replace(/^# (Quality Gate|Performance)$/m, "## $1"));
  const text = lines.join("\n").replace(/\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?/gu, "");
  if (text.length <= 60000) return text + "\n";
  return text.slice(0, 59000) + "\n\nReport truncated; full diagnostics are available in the linked workflow artifacts.\n";
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
