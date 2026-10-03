import { defineConfig } from "vitest/config";

import base from "./vitest.config";
import { frontendTests } from "./tests/suites";

export default defineConfig({
  resolve: base.resolve,
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "backend",
          include: ["tests/**/*.test.ts"],
          exclude: frontendTests,
        },
      },
      {
        extends: true,
        test: { name: "frontend", include: frontendTests },
      },
    ],
  },
});
