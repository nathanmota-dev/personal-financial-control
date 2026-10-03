#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const C = require("./config.js");

function templatesDirectory() {
  const installed = path.join(__dirname, "templates");
  return fs.existsSync(installed) ? installed : path.resolve(__dirname, "../assets/workflows");
}
function discover(root) {
  const result = [];
  function visit(directory, depth = 0) {
    if (depth > 3) return;
    const manifestPath = path.join(directory, "package.json");
    if (fs.existsSync(manifestPath) && fs.existsSync(path.join(directory, "src"))) result.push(C.relative(root, directory) || ".");
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.isSymbolicLink() && !["node_modules", "src", "scripts", "dist", "coverage", "build"].includes(entry.name) && !entry.name.startsWith(".")) visit(path.join(directory, entry.name), depth + 1);
    }
  }
  visit(root);
  if (!result.length) throw new C.InputError("No JS/TS package with src/ found. Initialize the application first or supply --projects-file.");
  return result.sort();
}
function npmScript(name) { return ["npm", "run", name]; }
function inferProject(root, directory) {
  const packagePath = C.inside(root, path.join(directory, "package.json")), manifest = C.readJson(packagePath);
  const scripts = manifest.scripts || {}, dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
  const name = directory === "." ? "app" : directory.split("/").at(-1);
  const sourceRoot = directory === "." ? "src" : `${directory}/src`;
  const commands = {};
  if (scripts.lint) commands.lint = [...npmScript("lint"), "--", "--max-warnings=0"];
  else if (fs.readdirSync(C.inside(root, directory)).some((file) => /^eslint\.config\./.test(file))) commands.lint = ["npm", "exec", "--no", "--", "eslint", ".", "--max-warnings=0"];
  else throw new C.InputError(`Configure ESLint in ${directory} before setup. See references/setup.md.`);
  commands.lint.push(...C.toolIgnoreArgs({ directory }));
  if (scripts.typecheck) commands.typecheck = npmScript("typecheck");
  else if (fs.existsSync(C.inside(root, path.join(directory, "tsconfig.json")))) {
    const ts = require("typescript"), parsed = ts.readConfigFile(C.inside(root, path.join(directory, "tsconfig.json")), ts.sys.readFile);
    if (parsed.error) throw new C.InputError(`Cannot read ${directory}/tsconfig.json.`);
    commands.typecheck = ["npm", "exec", "--no", "--", "tsc", ...parsed.config.references ? ["-b", "--pretty", "false"] : ["--noEmit"]];
  } else {
    const sourceFiles = require("./source-scan.js").scanSources(root, { name, sourceRoots: [sourceRoot] }).files;
    if (Object.keys(sourceFiles).some((file) => /\.[cm]?tsx?$/.test(file))) throw new C.InputError(`Missing TypeScript typecheck/tsconfig in ${directory}.`);
  }
  for (const key of ["build", "integration", "e2e"]) {
    const script = key === "build" ? "build" : `test:${key}`;
    if (scripts[script]) commands[key] = npmScript(script);
  }
  commands.coverage = scripts["test:coverage:ci"] ? npmScript("test:coverage:ci") : ["npm", "exec", "--no", "--", "vitest", "run", "--coverage",
    "--coverage.include=src/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}",
    "--coverage.exclude=src/**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}", "--coverage.exclude=src/**/__tests__/**",
    "--coverage.exclude=src/**/test/**", "--coverage.exclude=src/**/tests/**", "--coverage.exclude=src/**/*.d.{ts,mts,cts}",
    "--coverage.reporter=text", "--coverage.reporter=json-summary", "--coverage.reporter=html"];
  const benchmarkPath = `reports/benchmarks/${name}.json`, relativeOutput = path.relative(C.inside(root, directory), C.inside(root, benchmarkPath)).split(path.sep).join("/");
  commands.benchmark = scripts.benchmark ? [...npmScript("benchmark"), "--", `--outputJson=${relativeOutput}`]
    : ["npm", "exec", "--no", "--", "vitest", "bench", "--run", "--config", "vitest.benchmark.config.ts", `--outputJson=${relativeOutput}`];
  const installDirectory = directory !== "." && !fs.existsSync(C.inside(root, `${directory}/package-lock.json`)) && fs.existsSync(C.inside(root, "package-lock.json")) ? "." : directory;
  const project = { name, directory, installDirectory, sourceRoots: [sourceRoot], coveragePath: `${directory === "." ? "" : directory + "/"}coverage/coverage-summary.json`, benchmarkPath, commands };
  return { project, packagePath, manifest, dependencies };
}
function existingGate(root) {
  const directory = C.inside(root, ".github/workflows");
  if (!fs.existsSync(directory)) return false;
  const yaml = require("yaml");
  let quality = false, performance = false;
  for (const file of fs.readdirSync(directory).filter((name) => /\.ya?ml$/.test(name))) {
    const document = yaml.parse(fs.readFileSync(path.join(directory, file), "utf8"));
    const runs = Object.values(document?.jobs || {}).flatMap((job) => job.steps || []).map((step) => step.run || "").join("\n");
    quality ||= /(?:node|npm).*quality-gate\.js/.test(runs);
    performance ||= /(?:node|npm).*benchmark-gate\.js/.test(runs);
  }
  if (quality !== performance) throw new C.InputError("Existing gate is incomplete. Setup will not overwrite its files; inspect it explicitly.");
  return quality && performance;
}
function validationCommands(projects, root) {
  const commands = { quality: [], performance: [] };
  for (const project of projects) {
    for (const key of ["lint", "typecheck", "build", "coverage", "integration", "e2e"]) if (project.commands[key]) commands.quality.push({ name: `${project.name} ${key}`, command: project.commands[key], directory: project.directory });
    commands.performance.push({ name: `${project.name} microbenchmarks`, command: project.commands.benchmark, directory: project.directory });
  }
  for (const [kind, file] of [["quality", "quality-gate.js"], ["performance", "benchmark-gate.js"]]) {
    if (!fs.existsSync(C.inside(root, `scripts/${file}`))) throw new C.InputError(`Existing gate script missing: scripts/${file}`);
    commands[kind].push({ name: `${kind} comparison`, command: ["node", `scripts/${file}`], directory: "." });
  }
  return commands;
}
function prepare(root, custom) {
  const inferred = custom ? [] : discover(root).map((directory) => inferProject(root, directory));
  const projects = custom?.projects || inferred.map((item) => item.project);
  const branch = C.execute(["git", "symbolic-ref", "--short", "refs/remotes/origin/HEAD"], root);
  const baseBranch = custom?.baseBranch || (branch.status === 0 ? branch.stdout.trim().replace(/^origin\//, "") : "main");
  const nodeFile = [".nvmrc", ".node-version"].find((file) => fs.existsSync(C.inside(root, file)));
  const nodeVersion = custom?.nodeVersion || (nodeFile ? fs.readFileSync(C.inside(root, nodeFile), "utf8").trim().replace(/^v/, "") : "22");
  if (!/^[0-9]+(?:\.[0-9x]+){0,2}$/.test(nodeVersion)) throw new C.InputError("Set a numeric nodeVersion in --projects-file.");
  const config = { schemaVersion: 1, setupVersion: 1, mode: "managed", projects, policy: C.POLICY, baseBranch, nodeVersion, ci: custom?.ci || {} };
  C.validateConfig(config);
  for (const project of projects) {
    for (const value of [project.directory, ...project.sourceRoots, project.coveragePath, project.benchmarkPath]) C.inside(root, value);
    if (project.directory === "scripts" || project.sourceRoots.some((source) => source.startsWith("scripts/"))) throw new C.InputError("Application sources cannot use the gate scripts directory.");
    const sources = require("./source-scan.js").scanSources(root, project);
    if (Object.keys(sources.files).some((file) => /\.[cm]?tsx?$/.test(file)) && !project.commands.typecheck) throw new C.InputError(`Missing TypeScript typecheck command for ${project.name}.`);
  }
  return { config, inferred };
}
function install(root, config, inferred) {
  const yaml = require("yaml"), templateDir = templatesDirectory();
  const targets = fs.readdirSync(__dirname).filter((file) => file.endsWith(".js") || ["package.json", "package-lock.json"].includes(file));
  for (const file of targets) if (fs.existsSync(C.inside(root, `scripts/${file}`))) throw new C.InputError(`Will not overwrite existing scripts/${file}.`);
  for (const file of ["quality-gate.yml", "performance.yml", "pr-validation.yml"]) if (fs.existsSync(C.inside(root, `.github/workflows/${file}`))) throw new C.InputError(`Will not overwrite ${file}.`);
  if (!fs.existsSync(path.join(__dirname, "package-lock.json"))) throw new C.InputError("Install skill tool dependencies before setup (npm ci in scripts/).");
  fs.mkdirSync(C.inside(root, "scripts/templates"), { recursive: true });
  fs.mkdirSync(C.inside(root, ".github/workflows"), { recursive: true });
  for (const file of targets) fs.copyFileSync(path.join(__dirname, file), C.inside(root, `scripts/${file}`));
  for (const file of ["quality-gate.yml", "performance.yml", "pr-validation.yml"]) {
    const template = fs.readFileSync(path.join(templateDir, file), "utf8");
    fs.writeFileSync(C.inside(root, `scripts/templates/${file}`), template);
    const body = template.replaceAll("__BASE_BRANCH__", JSON.stringify(config.baseBranch)).replaceAll("__NODE_VERSION__", JSON.stringify(config.nodeVersion));
    const document = yaml.parse(body);
    if (config.ci.env) document.jobs.evaluate && (document.jobs.evaluate.env = { ...document.jobs.evaluate.env, ...config.ci.env });
    if (config.ci.services && document.jobs.evaluate) document.jobs.evaluate.services = config.ci.services;
    fs.writeFileSync(C.inside(root, `.github/workflows/${file}`), yaml.stringify(document, { lineWidth: 0 }));
  }
  for (const item of inferred) {
    const additions = {};
    if (!item.dependencies.vitest) additions.vitest = "4.1.10";
    if (!item.dependencies["@vitest/coverage-v8"]) additions["@vitest/coverage-v8"] = item.dependencies.vitest || "4.1.10";
    if (Object.keys(additions).length) C.writeJson(item.packagePath, { ...item.manifest, devDependencies: { ...item.manifest.devDependencies, ...additions } });
  }
  for (const project of config.projects) {
    const file = C.inside(root, `${project.directory}/vitest.benchmark.config.ts`);
    if (!fs.existsSync(file) && !project.commands.benchmark.includes("run")) fs.writeFileSync(file,
      'import { defineConfig } from "vitest/config";\nexport default defineConfig({ test: { environment: "node", fileParallelism: false, maxWorkers: 1, benchmark: { include: ["benchmarks/**/*.bench.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"] } } });\n');
  }
  const ignore = C.inside(root, ".gitignore"), previous = fs.existsSync(ignore) ? fs.readFileSync(ignore, "utf8") : "";
  const entries = ["/reports/", "/scripts/node_modules/", ...config.projects.map((p) => `/${p.directory === "." ? "" : p.directory + "/"}coverage/`)];
  fs.writeFileSync(ignore, previous + (previous && !previous.endsWith("\n") ? "\n" : "") + entries.filter((entry) => !previous.split("\n").includes(entry)).join("\n") + "\n");
  C.writeJson(C.inside(root, "scripts/quality-gate.config.json"), config);
}
function setup(root, custom) {
  const statePath = C.inside(root, "scripts/quality-gate.config.json");
  if (fs.existsSync(statePath)) {
    const state = C.readJson(statePath);
    if (state.schemaVersion !== 1 || state.setupVersion !== 1 || !["managed", "existing"].includes(state.mode)) throw new C.InputError("Unknown installation state; inspect before upgrading.");
    if (state.mode === "managed") {
      C.validateConfig(state);
      for (const file of ["scripts/quality-gate.js", "scripts/benchmark-gate.js", ".github/workflows/quality-gate.yml", ".github/workflows/performance.yml", ".github/workflows/pr-validation.yml"]) if (!fs.existsSync(C.inside(root, file))) throw new C.InputError(`Installed gate file missing: ${file}`);
    }
    return { status: "ready", mode: state.mode };
  }
  const { config, inferred } = prepare(root, custom);
  if (existingGate(root)) {
    const adopted = { ...config, mode: "existing", validationCommands: validationCommands(config.projects, root) };
    C.writeJson(statePath, adopted);
    return { status: "adopted", mode: "existing" };
  }
  install(root, config, inferred);
  return { status: "installed", mode: "managed", next: "Install application and scripts dependencies, add real production benchmarks, then run quality and performance. CI candidates must be reviewed before promoting baselines." };
}
function runCli(args = process.argv.slice(2)) {
  try {
    const options = C.argumentsFor(args, ["--projects-file"]);
    const result = setup(options.root, options["projects-file"] ? C.readJson(path.resolve(options.root, options["projects-file"])) : undefined);
    process.stdout.write(JSON.stringify(result, null, 2) + "\n"); return 0;
  } catch (error) { process.stderr.write(error.message + "\n"); return 2; }
}
module.exports = { discover, inferProject, existingGate, setup, runCli };
if (require.main === module) process.exitCode = runCli();
