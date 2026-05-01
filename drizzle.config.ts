import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      process.env.TURSO_DATABASE_URL ??
      "file:./.local/personal-finance.db",
    authToken: process.env.TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  },
  strict: true,
  verbose: true,
});
