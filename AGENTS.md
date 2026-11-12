# Personal Financial Control

Personal Financial app using Next.js, Tailwind Css, Drizzle, SQLite, Turso, Zod, Shadcn, recharts and Vitest.

---

After every task that changes code, tests, dependencies, or build/runtime/validation configuration, use [quality-gate-safe-delivery](.agents/skills/quality-gate-safe-delivery/SKILL.md). Run `npm run build`, `npm run lint`, `npm run test` (the full suite), `npm run quality:check` and `npm run quality:performance` sequentially. The gate covers type checking, coverage, audits, duplication, code size, helper tests, Playwright E2E and benchmarks; inspect the quality and performance reports before reporting results. Preserve the configured `no-regression` policy and baselines.

If the task makes no changes to code, tests, dependencies, or build/runtime/validation configuration, do not run quality gates, performance checks, build, lint, typecheck, tests, dependency installation, or other npm validation commands. This exemption includes read-only investigations, direct database/API data updates, and documentation-only edits (including this `AGENTS.md`). Verify only the affected data or documentation and report that code validation was not required. If any code-related change is made during the task, the full validation sequence above is required.

When naming branches, committing, pushing or opening/updating pull requests, follow [git-pr-conventions](.agents/skills/git-pr-conventions/SKILL.md).

---

## Running the app locally

- Start the dev server with `npm run dev` (http://localhost:3000).
- Start it in demo mode (fixture data, no real database) with `DEMO_MODE=true npm run dev`.
- Never run `npm run build` while the dev server is running: both write to `.next`, and a build that fails midway leaves the dev server reloading the page endlessly. Stop the dev server first. If it already looped, stop it, delete `.next` and start it again.
- Next/SWC can refuse to load with `ERR_SWC_NATIVE_CACHE` ("cache root contains a non-directory or symlink") when `~/.cache` is a symlink, as on this machine (`~/.cache -> /mnt/linux-data/cache`). It breaks `npm run dev`, `npm run build` and the gate. Fix it by pointing SWC at a real directory owned by the user, outside any symlink and not under a shared `/tmp` path: `mkdir -p -m 700 ~/.swc-native-cache`, then prefix the commands, e.g. `SWC_NATIVE_BINDING_CACHE=$HOME/.swc-native-cache DEMO_MODE=true npm run dev`, or `export` it for the shell session.

---

For new views, follow the existing app visual style and reuse its shadcn components.

Any UI change (new view, redesign or visual adjustment of an existing page) must follow [DESIGN.md](DESIGN.md), which documents the `/dashboard` route as the visual baseline: layout grid, tokens, typography, card anatomy, illustrations, components and loading skeletons. Use its semantic tokens instead of hardcoded colors, and update the route's `loading.tsx` skeleton so it matches the new layout.

----

Never create helper components inside a parent component; instead, create a helper component and import it into the parent.

----

Never place interfaces, types, or contracts inside a component; create a dedicated file for them and import the contract into the parent component and any helper components that need it. This ensures the contract is enforced throughout the app.

----

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
