---
name: quality-gate-safe-delivery
description: Configure a JavaScript/TypeScript project's quality and performance workflows once, then validate changes and consolidate coverage, maintainability, microbenchmarks, and workflow outcomes into one PR report.
---

# Quality gate safe delivery

Use this skill to install the gate at the beginning of a JS/TS project or finish a task in a project that already has it. Supports npm packages at the repository root and monorepos. The scripts use ESLint, Vitest/V8, JSCPD, and the TypeScript parser. Other language/toolchain adapters are outside this version.

## Route by project state

Resolve the target repository and read its applicable `AGENTS.md` instructions.

- If `scripts/quality-gate.config.json` has `setupVersion: 1`, read [validate.md](references/validate.md). Do not repeat installation, discovery, or rewrite the infrastructure.
- Otherwise, read [setup.md](references/setup.md) once. Existing quality/performance workflows are adopted and executed; a deploy workflow alone is not a quality gate.
- The installation marker records infrastructure readiness, not passing validation. Missing registered files or unsupported state versions are errors to investigate, not permission to reinstall silently.

See [comparison.md](references/comparison.md) when reviewing the origin and differences of the two source implementations. The original projects' measurements are not templates for another project's baseline.

## Protected invariants

- Minimum 80% lines, statements, functions, and branches per package; neither package coverage nor the weighted total may decrease.
- Duplication percentage and fragment count cannot increase, individually or across packages. ESLint errors and warnings must be zero.
- Production files must have at most 350 physical lines and executable functions at most 100 source lines; zero violations, including pre-existing oversized code.
- Throughput loss greater than 20%, missing tracked benchmarks, and malformed/missing required inputs block delivery. New benchmarks are visible warnings pending a reviewed reference.
- Preserve coverage scope, benchmark scenarios, test inputs, thresholds, baselines, and gate logic during ordinary implementation work. Infrastructure changes require their own explicit scope; do not use them to hide a failure.
- Respect the implementation diff and pre-existing user changes. Fix responsible code and directly related tests; do not refactor unrelated files to improve a score.
- Reports must distinguish passed, failed, pending, unselected, warning-only, and initial bootstrap states. Never claim checks passed from expectations or an earlier commit.

Installing/configuring workflows is part of an installation request. Commit, push, open a PR, promote an established reference, or manually rerun remote workflows only within the user's authorized task. There is no requirement for an associated issue. Once installed, the workflows publish their configured report automatically.
