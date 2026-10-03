import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Installed agent skills include standalone tooling outside the app.
    ".agents/skills/**",
    // Standalone CommonJS gate helpers; application utilities stay linted.
    "scripts/{setup,config,source-scan,quality-gate,benchmark-gate,workflow-report,run-checks,pr-validation,pr-report,publish-pr-report,select-projects,test-helpers}{,.node-test}.js",
    // Generated diagnostics and coverage reports.
    "reports/**",
    "coverage/**",
    // Generated from the linted TypeScript migration entry point.
    "scripts/migrate.mjs",
  ]),
]);

export default eslintConfig;
