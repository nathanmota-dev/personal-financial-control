# First use: configure once

This procedure belongs to the target project, not the shared skill installation. Once the project has `scripts/quality-gate.config.json` with `setupVersion: 1`, use `validate.md` instead.

## Prepare the actual project

1. Inspect Git status, applicable project instructions, package manifests, source roots, test/lint/build commands, coverage settings, and all existing workflows. Preserve unrelated files and user changes.
2. Install this skill's tools with `npm ci --prefix <skill-directory>/scripts`. Node 22 or newer is required.
3. Ensure each application package has ESLint configuration. Add an appropriate flat config and `eslint`/parser dependencies only when absent. Respect the project's rules and module format. TypeScript packages need a working `typecheck` script or `tsconfig.json`; JavaScript-only packages show typecheck as unselected.
4. Use existing Vitest/V8 tests. If absent, configure Vitest and add focused behavior tests for actual production code; match the V8 coverage package to the installed Vitest version. Do not copy tests from the original applications. Include every executable production JS/TS file, excluding test/spec files, test directories, and declarations. Keep existing stricter native thresholds.
5. Identify the expensive production operations worth measuring. Reuse existing Vitest benchmarks or create representative scenarios in each package's `benchmarks/`, with deterministic input sizes, warmup, and repeated measurements. Include a typical case and a larger/conflict-heavy case when the operation has that behavior. Do not introduce an unrelated placeholder to make the performance gate green.

A newly initialized project without production code or tests cannot provide a meaningful green gate. Configure the infrastructure, report the missing prerequisites, and complete real checks as the application is implemented.

## Install or adopt

For standard packages with `src/`, invoke the bundled installer:

```sh
node <skill-directory>/scripts/setup.js --root <target-repository>
```

The installer discovers packages up to three directories below the root, checks source paths and required commands, and determines the default branch and Node version. It identifies a gate through steps that invoke quality and benchmark collectors, not just the existence of a workflow directory. It preserves an existing gate and writes an `existing` execution record. An incomplete/conflicting installation is reported without overwriting it.

Without a gate it installs the helper scripts, their tests and npm lockfile, three workflows, ignore entries, and the project configuration. Existing unrelated scripts and workflows are preserved. Colliding helper filenames are errors.

Helper tests use the `*.node-test.js` suffix and run through Node's built-in test runner. They intentionally do not match Vitest's application-suite discovery. In inferred root packages, the installer excludes only the named CommonJS gate helpers from the application's lint command, preserving production rules and unrelated utilities. For custom commands, apply those same targeted ignores or configure Node/CommonJS rules for the helpers.

For different source layouts or CI prerequisites, supply a JSON configuration through `--projects-file`. This file contains `projects` and optional `baseBranch`, `nodeVersion`, and `ci`. Each project has:

```json
{
  "name": "frontend",
  "directory": "frontend",
  "installDirectory": "frontend",
  "sourceRoots": ["frontend/src"],
  "coveragePath": "frontend/coverage/coverage-summary.json",
  "benchmarkPath": "reports/benchmarks/frontend.json",
  "commands": {
    "lint": ["npm", "run", "lint", "--", "--max-warnings=0"],
    "typecheck": ["npm", "run", "typecheck"],
    "build": ["npm", "run", "build"],
    "coverage": ["npm", "run", "test:coverage:ci"],
    "benchmark": ["npm", "run", "benchmark", "--", "--outputJson=../reports/benchmarks/frontend.json"]
  }
}
```

Paths are repository-relative. Names use lowercase kebab-case. Source roots must not overlap; the dependency installation directory can be the workspace root. Commands are arrays of executable and arguments, with no shell interpolation. Build, typecheck, integration and E2E are optional only when genuinely inapplicable; lint, coverage and benchmarks are mandatory. Add `commands.integration` and `commands.e2e` whenever the package has those suites.

`ci.env` and `ci.services` are inserted into the evaluation jobs. Configure the database, test variables and other prerequisites discovered from the project. Use GitHub secret expressions for secrets, not committed values. If Playwright tests exist, ensure their browser and web-server setup is in the suite or evaluation workflow before considering installation validated. A missing service or browser must be a reported failure, not silently skipped.

Install/refresh the application lockfile in each distinct installation directory after dependency changes. Then run `npm ci --prefix scripts` in the target repository. Confirm the generated YAML and every configured command. The cache marker can exist while application checks fail; it must never be used as evidence of passing validation.

## Bootstrap references and GitHub reporting

Run quality and performance as described in `validate.md`. Without a reference the collectors write candidate baselines and clearly mark bootstrap. Coverage floors, lint, source-size limits and valid benchmark results still apply.

Establish performance references from the CI runner, not another application's values or a developer machine's speed. Download the exact CI attempt's passing candidate reports and review them before placing them in `scripts/baseline.json` and `scripts/benchmark-baseline.json`. Initial baselines can be introduced before the installation PR is merged. Established references must not be changed by ordinary tasks. `--update-baseline` is local-only, rejects failing/regressed metrics, and is disabled under `CI=true`.

The three workflows target the actual base branch. The reporter uses `workflow_run`, whose definition must exist on the default branch before GitHub starts invoking it. During the installation PR, use job summaries and artifacts for review; after integration, later PRs get the consolidated sticky comment and `PR Validation` commit status.

The generated workflows do not configure deployment or require an issue. Do not change remote branch protection or repository settings as part of installing these files.
