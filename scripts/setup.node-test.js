"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), yaml = require("yaml");
const S = require("./setup.js"), C = require("./config.js"), H = require("./test-helpers.js");
function app(root, directory = ".", type = "module") {
  const prefix = directory === "." ? "" : directory + "/";
  H.write(root, `${prefix}package.json`, { name: directory === "." ? "app" : directory, type, scripts: { lint: "eslint ." }, devDependencies: { eslint: "9.39.1", vitest: "4.1.10" } });
  H.write(root, `${prefix}src/index.js`, "export const value = 1;\n");
}
function snapshot(root) {
  const result = {};
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file); else result[C.relative(root, file)] = fs.readFileSync(file, "utf8");
    }
  }
  visit(root); return result;
}
test("fresh ESM app gets workflows, CommonJS tools, dependency metadata and cached state", (t) => {
  const root = H.temporary(t); app(root); H.write(root, ".gitignore", "existing-ignore\n");
  assert.equal(S.setup(root).status, "installed");
  assert.equal(C.readJson(path.join(root, "scripts/package.json")).type, "commonjs");
  assert.equal(C.readJson(path.join(root, "scripts/quality-gate.config.json")).setupVersion, 1);
  assert.equal(C.readJson(path.join(root, "package.json")).devDependencies["@vitest/coverage-v8"], "4.1.10");
  for (const file of ["quality-gate", "performance", "pr-validation"]) {
    const workflow = yaml.parse(fs.readFileSync(path.join(root, `.github/workflows/${file}.yml`), "utf8"));
    assert.ok(workflow.jobs); assert.ok(!fs.readFileSync(path.join(root, `.github/workflows/${file}.yml`), "utf8").includes("__NODE_VERSION__"));
  }
  assert.match(fs.readFileSync(path.join(root, ".gitignore"), "utf8"), /^existing-ignore/);
});
test("second setup is a read-only no-op, including timestamps and file contents", (t) => {
  const root = H.temporary(t); app(root); S.setup(root);
  const before = snapshot(root), timestamp = fs.statSync(path.join(root, "scripts/quality-gate.config.json")).mtimeMs;
  assert.equal(S.setup(root).status, "ready"); assert.deepEqual(snapshot(root), before);
  assert.equal(fs.statSync(path.join(root, "scripts/quality-gate.config.json")).mtimeMs, timestamp);
});
test("monorepo discovers both packages and configures pipeline metadata", (t) => {
  const root = H.temporary(t); app(root, "backend"); app(root, "frontend");
  S.setup(root);
  assert.deepEqual(C.readJson(path.join(root, "scripts/quality-gate.config.json")).projects.map((p) => p.name), ["backend", "frontend"]);
});
test("deploy-only workflow is preserved and does not count as a quality gate", (t) => {
  const root = H.temporary(t); app(root);
  const deploy = "name: Deploy\non: push\njobs:\n  deploy:\n    steps:\n      - run: npm run deploy\n";
  H.write(root, ".github/workflows/deploy.yml", deploy); S.setup(root);
  assert.equal(fs.readFileSync(path.join(root, ".github/workflows/deploy.yml"), "utf8"), deploy);
});
test("existing quality and benchmark workflows are adopted without replacing helpers", (t) => {
  const root = H.temporary(t); app(root);
  H.write(root, ".github/workflows/quality.yml", "jobs:\n  check:\n    steps:\n      - run: node scripts/quality-gate.js\n");
  H.write(root, ".github/workflows/bench.yml", "jobs:\n  check:\n    steps:\n      - run: node scripts/benchmark-gate.js\n");
  H.write(root, "scripts/quality-gate.js", "original quality collector"); H.write(root, "scripts/benchmark-gate.js", "original benchmark collector");
  const before = snapshot(root); assert.equal(S.setup(root).status, "adopted");
  const after = snapshot(root); delete after["scripts/quality-gate.config.json"];
  assert.deepEqual(after, before); assert.equal(S.setup(root).mode, "existing");
});
test("missing cached files, unsupported state and conflicting helpers are errors", (t) => {
  const root = H.temporary(t); app(root); S.setup(root);
  fs.unlinkSync(path.join(root, "scripts/quality-gate.js")); assert.throws(() => S.setup(root), /missing/);
  const other = H.temporary(t); app(other); H.write(other, "scripts/config.js", "original");
  assert.throws(() => S.setup(other), /overwrite/); assert.equal(fs.readFileSync(path.join(other, "scripts/config.js"), "utf8"), "original");
});
test("custom roots, Node version, branch and CI service/environment settings survive generation", (t) => {
  const root = H.temporary(t); app(root, "apps/web");
  const custom = { projects: [H.project("web", "apps/web")], nodeVersion: "24", baseBranch: "develop", ci: { env: { DATABASE_URL: "postgresql://test" }, services: { postgres: { image: "postgres:16" } } } };
  S.setup(root, custom);
  const workflow = yaml.parse(fs.readFileSync(path.join(root, ".github/workflows/quality-gate.yml"), "utf8"));
  assert.deepEqual(workflow.on.pull_request.branches, ["develop"]); assert.equal(workflow.jobs.evaluate.env.DATABASE_URL, "postgresql://test");
  assert.equal(workflow.jobs.evaluate.services.postgres.image, "postgres:16");
});
test("installed helper tests have their templates available in target scripts directory", (t) => {
  const root = H.temporary(t); app(root); S.setup(root);
  assert.ok(fs.existsSync(path.join(root, "scripts/templates/quality-gate.yml")));
  const result = C.execute([process.execPath, path.join(root, "scripts/setup.js"), "--root", root], root);
  // Shared installer uses target state and never changes application module semantics.
  assert.equal(result.status, 0); assert.equal(C.readJson(path.join(root, "package.json")).type, "module");
});
test("setup rejects TypeScript without a typecheck and does not create partial infrastructure", (t) => {
  const root = H.temporary(t); app(root); H.write(root, "src/typed.ts", "export const value: number = 1;\n");
  assert.throws(() => S.setup(root), /TypeScript typecheck/);
  assert.equal(fs.existsSync(path.join(root, "scripts/quality-gate.config.json")), false);
});
test("helper suites do not match application Vitest suite discovery", () => {
  const applicationPattern = /\.(test|spec)\.(?:[cm]?[jt]sx?)$/;
  assert.ok(fs.readdirSync(__dirname).filter((file) => file.endsWith(".node-test.js")).every((file) => !applicationPattern.test(file)));
});
