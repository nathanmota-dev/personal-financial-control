# Subsequent use: execute the registered gate

Read the project state and applicable `AGENTS.md`; do not repeat `setup.md`. Check that registered helpers/workflows exist and the state version is supported. A cached record is project-specific and must not be copied from another application.

## Local checks

Use the installed helpers in managed projects:

```sh
node scripts/run-checks.js --root . --workflow quality
node scripts/run-checks.js --root . --workflow performance
```

For an adopted pre-existing gate, run the shared skill's `scripts/run-checks.js --root <project> --workflow quality` and then `--workflow performance`. It uses the recorded existing commands; it does not replace collectors or workflows. Install dependencies and run any additional checks required by the existing project's instructions.

Quality runs dependency installation, critical/high audits, build, zero-warning lint, typecheck, unit tests with complete coverage, available integration/E2E suites, helper tests, and metric collection/comparison. Missing applicable commands or prerequisites must be corrected in scope. Unselected/inapplicable checks remain visible as such. A skipped required check fails.

Performance runs package benchmarks sequentially, tests the comparator and checks throughput against the trusted baseline. Locally, the default is all packages. CI selects affected package paths; changes to gate infrastructure select all. Initial bootstrap must capture every configured package. The raw report paths are fixed in the project configuration.

The direct collectors accept:

- `--root <repository>` and `--config <configuration>`; paths never default to the shared skill directory.
- `--baseline <reference>`; CI can provide `QUALITY_GATE_BASELINE_PATH` and `BENCHMARK_BASELINE_PATH`.
- `--bootstrap` for initial measurement without a trusted reference.
- `--update-baseline` only for an explicitly scoped local reference change; CI rejects it and failing/regressed results cannot be promoted.
- `quality-gate.js --no-collect` to compare already-generated ESLint/JSCPD inputs. Only use fresh inputs from this execution.
- `benchmark-gate.js --projects <comma-separated names>` to select benchmark packages. An empty list means none; it does not mean all.

Collectors return `0` for passing policy checks, `1` for a regression/policy failure, and `2` for missing/malformed inputs. The workflow runner also blocks failed command outcomes even if metric files look green.

## Inspect evidence

Read `reports/quality-gate.md`, `reports/performance.md`, corresponding JSON, and `quality-workflow.json`/`performance-workflow.json`. Raw lint, duplication, coverage, audits, benchmarks and logs are diagnostic artifacts. Candidate references are outputs for review, never automatic replacements.

No package's coverage regression may be concealed by another package or the weighted total. Absolute 350/100 limits do not grandfather existing debt. Duplication is checked per package and for cross-package clones. Type declarations are excluded from coverage and duplication; their physical size still counts. Test/spec files and test directories are excluded from production size and duplication measurements.

For CI handoff, inspect the current PR SHA's latest attempts and `PR Validation`, not an older successful run. The publisher verifies artifact provenance, exposes required missing artifacts, updates one bot-owned comment and prevents older-SHA events from replacing current results. Selected required cancellations, timeouts and skipped checks fail; high-severity audits remain warnings. Bootstrap is visible and is not evidence of historical regression comparison.

## Handle failures in scope

Find the responsible changed implementation and directly related dependencies. Preserve unrelated files and user edits. Add focused behavior tests when coverage is missing. Fix implementation rather than changing data, scenarios, size limits, exclusions, thresholds or baselines.

If a performance result appears unstable, reproduce the same scenario/commit and compare up to three runs with runner and RME recorded. Do not infer causality from one run or compare machine speeds as if they were identical. RME is diagnostic, not a waiver of the throughput gate. Further remote reruns require task authorization.

If the cause requires an unrelated change, report evidence and the necessary scope expansion. In the handoff give the files changed, commands actually run, outcomes, reports inspected, remaining failures and any protected infrastructure changes. Do not claim completion with failing or unexecuted required checks.
