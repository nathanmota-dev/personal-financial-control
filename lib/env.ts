import { loadEnvConfig } from "@next/env";
import { z } from "zod";

loadEnvConfig(process.cwd());

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .or(z.string().startsWith("file:"))
    .optional(),
  TOKEN: z.string().min(1).optional(),
  TURSO_DATABASE_URL: z.string().min(1).optional(),
  TURSO_AUTH_TOKEN: z.string().min(1).optional(),
  DATA_ENCRYPTION_KEY: z.string().min(1, "DATA_ENCRYPTION_KEY is required"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema> & {
  DATABASE_URL: string;
};

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ")}`
    );
  }

  const url =
    parsed.data.DATABASE_URL ??
    parsed.data.TURSO_DATABASE_URL ??
    (parsed.data.NODE_ENV === "test"
      ? "file:./.tmp/test.db"
      : "file:./.local/personal-finance.db");

  return {
    ...parsed.data,
    DATABASE_URL: url,
    TOKEN: parsed.data.TOKEN ?? parsed.data.TURSO_AUTH_TOKEN,
  };
}
