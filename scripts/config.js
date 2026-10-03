"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { isDeepStrictEqual } = require("node:util");

class InputError extends Error {}
const METRICS = ["lines", "statements", "functions", "branches"];
const POLICY = Object.freeze({
  maxFileLines: 350, maxFunctionLines: 100, minimumCoverage: 80,
  maxRegressionPercent: 20,
  duplication: { minLines: 5, minTokens: 50, maxLines: 10000, mode: "strict", crossFormats: "js-ts" },
});
const EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"]);
const TEST_PATTERN = /(^|\/)(__tests__|test|tests)(\/|$)|\.(test|spec)\.[^/]+$/;
const DECLARATION_PATTERN = /\.d\.(ts|mts|cts)$/;
const TOOL_NAMES = ["setup", "config", "source-scan", "quality-gate", "benchmark-gate", "workflow-report", "run-checks", "pr-validation", "pr-report", "publish-pr-report", "select-projects", "test-helpers"];
function toolIgnoreArgs(project) {
  return project.directory === "." ? ["--ignore-pattern", `scripts/{${TOOL_NAMES.join(",")}}{,.node-test}.js`] : [];
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { throw new InputError(`Cannot read JSON ${file}: ${error.message}`); }
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}
function inside(root, relative) {
  if (typeof relative !== "string") throw new InputError("Expected a relative path.");
  const absolute = path.resolve(root, relative);
  const difference = path.relative(root, absolute);
  if (path.isAbsolute(relative) || difference === ".." || difference.startsWith(`..${path.sep}`)) {
    throw new InputError(`Path escapes project: ${relative}`);
  }
  return absolute;
}
function relative(root, file) { return path.relative(root, file).split(path.sep).join("/"); }
function escape(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll("@", "&#64;").replaceAll("|", "\\|")
    .replaceAll("`", "\\`").replace(/[\r\n]+/g, " ");
}
function finite(value, label, positive = false) {
  if (!Number.isFinite(value) || value < 0 || (positive && value === 0)) throw new InputError(`Invalid ${label}.`);
  return value;
}
function count(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new InputError(`Invalid count: ${label}.`);
  return value;
}
function ratio(value, label) {
  if (!value || typeof value !== "object") throw new InputError(`Missing ${label}.`);
  count(value.covered, `${label}.covered`); count(value.total, `${label}.total`);
  if (value.covered > value.total) throw new InputError(`Invalid ratio ${label}.`);
  return { covered: value.covered, total: value.total };
}
function percentage(value) { return value.total ? value.covered / value.total * 100 : 100; }
function lower(current, baseline) {
  return current.total === 0 ? baseline.total > 0
    : baseline.total > 0 && current.covered * baseline.total < baseline.covered * current.total;
}
function execute(command, cwd, options = {}) {
  const [binary, ...args] = command;
  const executable = process.platform === "win32" && binary === "npm" ? "npm.cmd" : binary;
  const result = spawnSync(executable, args, {
    cwd, encoding: "utf8", maxBuffer: 30 * 1024 * 1024,
    shell: process.platform === "win32" && executable.endsWith(".cmd"), ...options,
  });
  return { ...result, stdout: result.stdout || "", stderr: result.stderr || result.error?.message || "" };
}
function argumentsFor(args, extra = []) {
  const options = { root: process.cwd(), config: process.env.QUALITY_GATE_CONFIG_PATH, projects: undefined };
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (["--bootstrap", "--update-baseline", "--no-collect"].includes(key)) options[key.slice(2)] = true;
    else if (["--root", "--config", "--baseline", "--projects", ...extra].includes(key)) {
      const value = args[++index];
      if (value === undefined || value.startsWith("--")) throw new InputError(`${key} requires a value.`);
      options[key.slice(2)] = value;
    } else throw new InputError(`Unknown argument: ${key}`);
  }
  options.root = path.resolve(options.root);
  return options;
}
function validateConfig(config) {
  if (config?.schemaVersion !== 1 || !Array.isArray(config.projects) || !config.projects.length) {
    throw new InputError("Configuration requires schemaVersion 1 and at least one project.");
  }
  const names = new Set();
  if (config.qualityMode !== undefined && !["strict", "no-regression"].includes(config.qualityMode)) throw new InputError("Unknown quality mode.");
  if (config.localBenchmarkBaselinePath !== undefined && typeof config.localBenchmarkBaselinePath !== "string") throw new InputError("Invalid local benchmark baseline path.");
  for (const project of config.projects) {
    if (!/^[a-z][a-z0-9-]*$/.test(project.name) || names.has(project.name)) throw new InputError("Invalid or duplicate project name.");
    names.add(project.name);
    if (typeof project.directory !== "string" || !Array.isArray(project.sourceRoots) || !project.sourceRoots.length) {
      throw new InputError(`Invalid paths for ${project.name}.`);
    }
    for (const key of ["coverage", "benchmark", "lint"]) {
      if (!Array.isArray(project.commands?.[key]) || !project.commands[key].length) throw new InputError(`Missing ${project.name} ${key} command.`);
    }
    for (const command of Object.values(project.commands)) {
      if (!Array.isArray(command) || !command.length || command.some((part) => typeof part !== "string" || !part || /[\r\n]/.test(part))) {
        throw new InputError(`Invalid command in ${project.name}.`);
      }
    }
    if (typeof project.coveragePath !== "string" || typeof project.benchmarkPath !== "string") throw new InputError("Missing report paths.");
  }
  // These defaults are invariants, not flags that a task may weaken.
  if (config.policy && !isDeepStrictEqual(config.policy, POLICY)) throw new InputError("Policy differs from the protected 80/350/100/20 defaults.");
  return { ...config, policy: POLICY };
}
function loadConfig(options) {
  const configPath = options.config ? path.resolve(options.root, options.config) : inside(options.root, "scripts/quality-gate.config.json");
  const config = validateConfig(readJson(configPath));
  if (config.localBenchmarkBaselinePath) inside(options.root, config.localBenchmarkBaselinePath);
  for (const project of config.projects) {
    for (const item of [project.directory, project.installDirectory ?? project.directory, project.coveragePath, project.benchmarkPath, ...project.sourceRoots]) inside(options.root, item);
  }
  return config;
}
function benchmarkBaselinePath(config) {
  return process.env.BENCHMARK_BASELINE_PATH || (process.env.CI !== "true" && config.localBenchmarkBaselinePath) || "scripts/benchmark-baseline.json";
}
function provenance() {
  return { headSha: process.env.PR_HEAD_SHA || process.env.GITHUB_SHA || "local", runId: process.env.GITHUB_RUN_ID || "local", runAttempt: process.env.GITHUB_RUN_ATTEMPT || "1" };
}
function failureReport(root, kind, error) {
  fs.mkdirSync(inside(root, "reports"), { recursive: true });
  const title = kind === "quality-gate" ? "Quality Gate" : "Performance";
  fs.writeFileSync(inside(root, `reports/${kind}.md`), `# ${title}\n\n**ERROR** — ${escape(error.message)}\n`);
  writeJson(inside(root, `reports/${kind}.json`), { schemaVersion: 1, status: "error", error: error.message, ...provenance() });
}
module.exports = { InputError, METRICS, POLICY, EXTENSIONS, TEST_PATTERN, DECLARATION_PATTERN, toolIgnoreArgs, readJson, writeJson, inside, relative, escape, finite, count, ratio, percentage, lower, execute, argumentsFor, validateConfig, loadConfig, benchmarkBaselinePath, provenance, failureReport };
