import type { AppDb } from "@/lib/db";

export type FinanceDatabaseRuntime = typeof globalThis & {
  __pfcDemoDatabaseUrl?: Promise<string>;
};

export type FinanceTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
export type FinanceDatabase = AppDb | FinanceTransaction;
export type ForeignKeyDeleteAction = "cascade" | "restrict" | "set null" | "no action" | "set default";
