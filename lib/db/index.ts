import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { demoFixture } from "@/lib/demo/fixture";
import { getServerEnv } from "@/lib/env";
import * as schema from "@/lib/db/schema";
import {
  accounts,
  categories,
  creditCardCharges,
  creditCardInstallments,
  financialGoalAllocations,
  financialGoals,
  investmentPortfolio,
  recurringTemplates,
  transactions,
  transfers,
} from "@/lib/db/schema";

export function createDatabase(url: string, authToken?: string) {
  const client = createClient({
    url,
    authToken,
  });

  return drizzle({ client, schema });
}

export type AppDb = ReturnType<typeof createDatabase>;

let cachedDatabase: AppDb | undefined;
let demoDatabasePromise: Promise<AppDb> | undefined;

export function getDatabase() {
  if (cachedDatabase) {
    return cachedDatabase;
  }

  const env = getServerEnv();

  if (env.DEMO_MODE) {
    throw new Error("Demo mode uses its in-memory database. Call getFinanceDatabase instead.");
  }

  cachedDatabase = createDatabase(env.DATABASE_URL, env.TOKEN);

  return cachedDatabase;
}

export async function getFinanceDatabase() {
  const env = getServerEnv();

  if (!env.DEMO_MODE) {
    return getDatabase();
  }

  if (!demoDatabasePromise) {
    demoDatabasePromise = initializeDemoDatabase();
  }

  return demoDatabasePromise;
}

async function initializeDemoDatabase() {
  const demoDirectory = mkdtempSync(join(tmpdir(), "pfc-demo-"));
  const database = createDatabase(`file:${join(demoDirectory, "demo.db")}`);

  try {
    await migrate(database, {
      migrationsFolder: join(process.cwd(), "drizzle"),
    });

    await database.transaction(async (transaction) => {
      await transaction.insert(categories).values(demoFixture.categories);
      await transaction.insert(accounts).values(demoFixture.accounts);
      await transaction.insert(recurringTemplates).values(demoFixture.recurringTemplates);
      await transaction.insert(transactions).values(demoFixture.transactions);
      await transaction.insert(transfers).values(demoFixture.transfers);
      await transaction.insert(creditCardCharges).values(demoFixture.creditCardCharges);
      await transaction
        .insert(creditCardInstallments)
        .values(demoFixture.creditCardInstallments);
      await transaction.insert(investmentPortfolio).values(demoFixture.investmentPortfolio);
      await transaction.insert(financialGoals).values(demoFixture.financialGoals);
      await transaction
        .insert(financialGoalAllocations)
        .values(demoFixture.financialGoalAllocations);
    });

    process.once("exit", () => {
      rmSync(demoDirectory, { recursive: true, force: true });
    });

    return database;
  } catch (error) {
    rmSync(demoDirectory, { recursive: true, force: true });
    throw error;
  }
}
