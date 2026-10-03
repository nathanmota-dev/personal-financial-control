export type FinanceDatabaseRuntime = typeof globalThis & {
  __pfcDemoDatabaseUrl?: Promise<string>;
};
