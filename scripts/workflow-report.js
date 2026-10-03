"use strict";
const fs = require("node:fs");
const C = require("./config.js");
const P = require("./pr-validation.js");

function normalize(check) {
  const selected = check.selected !== false, blocking = check.blocking !== false;
  const outcome = String(check.outcome || "unknown").toLowerCase();
  const result = !selected ? "SKIPPED" : outcome === "success" ? "PASS"
    : outcome === "pending" || outcome === "in_progress" ? "PENDING"
      : blocking ? "FAIL" : "WARNING";
  return { ...check, selected, blocking, outcome, result };
}
function overall(checks) {
  if (checks.some((check) => check.selected && check.blocking && check.result === "FAIL")) return "FAIL";
  if (checks.some((check) => check.selected && check.blocking && check.result === "PENDING")) return "PENDING";
  if (!checks.some((check) => check.selected && check.blocking)) return "SKIPPED";
  return "PASS";
}
function manifest(workflow, checks) {
  const normalized = checks.map(normalize);
  return { schemaVersion: 1, workflow, overall: overall(normalized), checks: normalized, ...C.provenance() };
}
function write(root, workflow, checks) {
  const result = manifest(workflow, checks);
  const key = P.workflowDefinition(workflow)?.key;
  if (!key) throw new C.InputError(`Unknown report workflow: ${workflow}`);
  C.writeJson(C.inside(root, `reports/${key}-workflow.json`), result);
  const lines = [`# ${workflow} workflow checks`, "", `**${result.overall}**`, "", "| Check | Result | Selected | Blocking |", "|---|---|---|---|"];
  for (const check of result.checks) lines.push(`| ${C.escape(check.name)} | ${check.result} | ${check.selected ? "Yes" : "No"} | ${check.blocking ? "Yes" : "No (warning)"} |`);
  const summary = lines.join("\n") + "\n";
  fs.writeFileSync(C.inside(root, `reports/${key}-workflow.md`), summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  return result;
}
module.exports = { normalize, overall, manifest, write };
