# Personal Financial Control

Personal Financial app using Next.js, Tailwind Css, Drizzle, SQLite, Turso, Zod, Shadcn, recharts and Vitest.

---

After every task that changes code, tests, dependencies, or build/runtime/validation configuration, use [quality-gate-safe-delivery](.agents/skills/quality-gate-safe-delivery/SKILL.md). Run `npm run build`, `npm run lint`, `npm run test` (the full suite), `npm run quality:check` and `npm run quality:performance` sequentially. The gate covers type checking, coverage, audits, duplication, code size, helper tests, Playwright E2E and benchmarks; inspect the quality and performance reports before reporting results. Preserve the configured `no-regression` policy and baselines.

If the task makes no changes to code, tests, dependencies, or build/runtime/validation configuration, do not run quality gates, performance checks, build, lint, typecheck, tests, dependency installation, or other npm validation commands. This exemption includes read-only investigations, direct database/API data updates, and documentation-only edits (including this `AGENTS.md`). Verify only the affected data or documentation and report that code validation was not required. If any code-related change is made during the task, the full validation sequence above is required.

When naming branches, committing, pushing or opening/updating pull requests, follow [git-pr-conventions](.agents/skills/git-pr-conventions/SKILL.md).

---

If you need create a new view (using css), learn frontend-design skills for understanding the design principles and create the view accordingly.

----

Never create helper components inside a parent component; instead, create a helper component and import it into the parent.

----

Never place interfaces, types, or contracts inside a component; create a dedicated file for them and import the contract into the parent component and any helper components that need it. This ensures the contract is enforced throughout the app.

----

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
