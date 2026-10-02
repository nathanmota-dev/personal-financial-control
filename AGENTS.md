# Personal Financial Control

Personal Financial app using Next.js, Tailwind Css, Drizzle, SQLite, Turso, Zod, Shadcn, recharts and Vitest.

---

Always after finish one task, run 'npm run build' and 'npm run lint' and 'npm run test'. Don't run tests only the files changed, run tests on all files.

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
