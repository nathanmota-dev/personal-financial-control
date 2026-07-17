import { loadEnvConfig } from "@next/env";
import { z } from "zod";

loadEnvConfig(process.cwd());

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DEMO_MODE: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined || value.trim() === "") {
        return false;
      }

      const normalized = value.trim().toLowerCase();

      if (["true", "1", "yes", "on"].includes(normalized)) {
        return true;
      }

      if (["false", "0", "no", "off"].includes(normalized)) {
        return false;
      }

      throw new Error("DEMO_MODE must be a boolean value.");
    }),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .or(z.string().startsWith("file:"))
    .optional(),
  TOKEN: z.string().min(1).optional(),
  TURSO_DATABASE_URL: z.string().min(1).optional(),
  TURSO_AUTH_TOKEN: z.string().min(1).optional(),
  DATA_ENCRYPTION_KEY: z.string().min(1).optional(),
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

  if (!parsed.data.DEMO_MODE && !parsed.data.DATA_ENCRYPTION_KEY) {
    throw new Error("Invalid server environment: DATA_ENCRYPTION_KEY: Required");
  }

  const url =
    parsed.data.DEMO_MODE
      ? "file::memory:"
      : parsed.data.DATABASE_URL ??
        parsed.data.TURSO_DATABASE_URL ??
        (parsed.data.NODE_ENV === "test"
          ? "file:./.tmp/test.db"
          : "file:./.local/personal-finance.db");
  const token = url.startsWith("file:")
    ? undefined
    : parsed.data.TOKEN ?? parsed.data.TURSO_AUTH_TOKEN;

  return {
    ...parsed.data,
    DATABASE_URL: url,
    TOKEN: token,
  };
}
