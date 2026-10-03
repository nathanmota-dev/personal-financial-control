# Source comparison and extraction map

Inspected on 2026-10-01: Gestão Solo main at `f062e35` and Daily Notch Tracker main at `056a481`. The source JavaScript helper tests passed: 38 in Gestão Solo and 37 in Daily Notch. No full application CI or remote workflow was rerun during the comparison.

## Historical comments versus current implementation

- [Daily Notch PR 89](https://github.com/nathanmota-dev/daily-notch-tracker/pull/89#issuecomment-5553811256): updated 2026-09-05, combined quality/performance checks; frontend and a second language's coverage and maintainability; 350-line files and 100-line functions; throughput and RME.
- [Gestão Solo PR 12](https://github.com/techtann/gestaosolo/pull/12#issuecomment-5686774326): updated 2026-09-15, weighted/package coverage, duplication, violations and performance. This historical report used 300-line file limits and grandfathered existing debt. Backend performance failed at approximately 21.55% and 21.58% loss; frontend was unselected.
- Current Gestão Solo code uses absolute 350-line file and 100-line function limits with zero violations. Its newer PR Validation reporter aggregates Backend CI, Frontend CI, Frontend E2E, Quality and Performance, but only inserts workflow links rather than the detailed metric artifact contents.
- Daily Notch's `scripts/README.md` still describes older 300-line/grandfathering behavior. Its executable policy and tests enforce 350/100 absolute limits. The executable policy is the basis for this package.

## Checks, semantics and gaps

| Area | Gestão Solo current | Daily Notch current | Extracted behavior |
|---|---|---|---|
| npm installation | backend/frontend | root package | configurable install directories; workspace installation deduplicated |
| dependency audits | critical blocks, high warning | same | preserve both and visible outcomes |
| lint | errors plus warnings; CI zero warnings | zero ESLint violations | zero errors/warnings and validated JSON |
| typecheck/build | separate CI workflows | quality job and frontend CI | quality runner includes applicable commands |
| unit coverage | Vitest/V8, full production scope | same for JS/TS | exact covered/total counts; check every source file |
| absolute coverage floor | collector has none; CI-only command overrides native thresholds to zero | 80% in all frontend metrics | 80% lines/statements/functions/branches per package |
| relative coverage | package and weighted total cannot fall | independent project metrics cannot fall | both, no averaging percentages |
| duplication | combined JSCPD scan | per-project scans | individual and combined percentage/fragment checks |
| JSCPD parameters | min 5 lines/50 tokens, max 10000, strict, JS/TS cross-format | same for JS/TS | same protected inputs |
| source sizes | physical lines, zero >350 | same JS/TS default | same; tests excluded, declarations still sized |
| function sizes | TypeScript AST, complete declaration-to-end range | masked-source regex, body range | TypeScript AST including nested callbacks and expression arrows |
| missing coverage | rejects missing/unexpected normalized production paths | same in JS/TS | same, plus verify summary totals against entries |
| integration/E2E | integration workflow and always-selected E2E included in aggregate | separate frontend/E2E workflows not included in the quality/performance comment | include present suites in managed quality runner |
| performance scenarios | two appointment-slot cases; two calendar-layout cases | one JS static React render case | choose target project's real production operations; do not transplant scenarios |
| performance gate | throughput loss >20% | same | same; exact 20% passes |
| benchmark input | validate throughput, mean, median, RME, sampleCount, unique names, nonempty reports | same | preserve; finite nonnegative RME and positive integer samples |
| tracked benchmark removed | blocks | blocks | preserve |
| new benchmark | warning until reviewed baseline | same | preserve |
| selection | backend/frontend changed paths; infrastructure selects both | frontend and another runtime; targeted workflow-diff detection | configured package/source roots and conservative infrastructure selection |
| quality schema | v1 backend/frontend | v2 project metrics, legacy v1 migration | self-contained v1 configurable JS/TS projects; existing gates stay native |
| trusted reference | PR base SHA | same | same; candidate branch cannot weaken established references |
| initial quality reference | fallback to checked-in reference | explicit bootstrap with absolute checks | explicit bootstrap, full absolute policy |
| initial performance reference | runner bootstrap, no local-speed comparison | same | preserve |
| baseline mutation | local flag, disallowed in CI | same | preserve; never promote failing/regressed results |
| infrastructure protection | protected-file CI guard and reporter | primarily skill instructions plus trusted reference | protect installed helpers, policies, workflows and scenarios |
| attempts/SHA | reconciles latest runs and reruns for exact PR/SHA | reporter waits up to ten minutes for performance | event-driven exact-attempt consolidation; no polling window |
| rendering | newer reporter shows statuses and links | detail tables and consolidated check manifest | aggregate status plus all quality/performance details |
| missing artifacts | newer reporter does not consume metric artifacts | explains unavailable report; some manifest normalization can leave skipped checks ambiguous | required missing/malformed artifacts or skipped checks fail |
| sticky comment | one bot comment, duplicates removed | same | same with project-independent marker |
| report outputs | quality/performance MD+JSON, candidates, ESLint/JSCPD, raw coverage/benchmarks | same plus workflow manifests | all plus precise provenance and command logs |

The regex gap was reproduced with controlled JS/TS snippets: named block arrows were found by both; inline callbacks, expression arrows and arrows assigned to object properties were missed by Daily Notch. A 101-line declaration with multiline signature was counted as a 97-line body by that implementation. The AST collector found all cases.

Both source performance comparators use microbenchmark throughput. RME, mean, median and sample count describe samples; RME is not a blocking threshold or automatic instability exemption. Neither source gate measures production request latency, memory, browser responsiveness, bundle size, cyclomatic complexity, cognitive complexity or dependency coupling. Those are not added to this extraction.

## Runtime resources retained

- `quality-gate.js` / `source-scan.js`: generalized Gestão Solo collector and parser plus independent package reporting/80% floor from Daily Notch.
- `benchmark-gate.js`: shared Vitest benchmark schema and comparison rules; dynamic package names instead of two fixed applications.
- `workflow-report.js` / `run-checks.js`: check outcomes, audit warning semantics and final enforcement formerly spread across shell and inline JavaScript in workflow YAMLs.
- `pr-validation.js` / `select-projects.js`: affected-package selection, newest attempt, PR/SHA scoping, missing/cancelled/pending handling.
- `pr-report.js`: detail consolidation and markdown sanitization based on Daily Notch's reporter, combined with aggregate status.
- `publish-pr-report.js`: API association, exact-attempt artifacts, trusted reporter, sticky comment/status operations formerly embedded in workflow code.
- `setup.js` / `config.js`: new per-project configuration, install/adopt detection, cached routing, path/schema validation and npm/CommonJS portability.

The second-language collectors, formatter/linter/test/coverage commands, system libraries and benchmark conversion helper are excluded. Baseline numeric values, application imports, deployment workflows, original bot markers, original fixed project names and issue requirements are not copied.
