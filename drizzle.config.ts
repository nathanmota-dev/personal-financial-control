import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

const url =
  process.env.DATABASE_URL ??
  process.env.TURSO_DATABASE_URL ??
  "file:./.local/personal-finance.db";

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken: url.startsWith("file:")
      ? undefined
      : process.env.TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  },
  strict: true,
  verbose: true,
});
