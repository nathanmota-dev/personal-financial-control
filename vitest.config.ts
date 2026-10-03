import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "{app,components,hooks,lib}/**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}",
        "proxy.ts",
      ],
      exclude: [
        // Imported JSON is data, not executable JS/TS production code.
        "**/*.json",
        "**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}",
        "**/{__tests__,test,tests}/**",
        "**/*.d.{ts,mts,cts}",
      ],
      excludeAfterRemap: true,
      reporter: ["text-summary", "json-summary", "html"],
      reportOnFailure: true,
      thresholds: {
        lines: 46.57,
        statements: 46.63,
        functions: 40.08,
        branches: 33.44,
      },
    },
  },
});
