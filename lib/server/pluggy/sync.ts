import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { pluggyItems } from "@/lib/db/schema";
import { replicaError } from "@/lib/db/replica-errors";
import type {
  PluggyItemRecord,
  PluggyLinkRecord,
  PluggyRemoteAccount,
  PluggyRemoteBill,
  PluggyRemoteTransaction,
  PluggySyncFailure,
  PluggySyncOptions,
  PluggySyncRunStatus,
  PluggySyncRunView,
  PluggySyncStep,
  PluggySyncStepContext,
  PluggySyncStepResult,
  PluggySyncSummary,
} from "@/lib/interfaces/pluggy";
import { DomainError } from "@/lib/server/errors";
import { pluggyRuntime } from "./config";
import { accountCheckStep } from "./steps/account-check";
import { alignReserveCheckpointStep } from "./steps/align-reserve-checkpoint";
import { importBankTransactionsStep } from "./steps/import-bank-transactions";
import { importCardBillsStep, matchBillPaymentsStep, reportCardBillsStep } from "./steps/import-card-bills";
import { importCardPurchasesStep } from "./steps/import-card-purchases";
import { itemStatusStep } from "./steps/item-status";
import { syncInvestmentPositionsStep } from "./steps/sync-investment-positions";
import { closePluggyRun, openPluggyRun } from "./sync-runs";

/** Steps run in this order. Import steps from later issues are appended here, each in its own file. */
export const pluggySyncSteps: readonly PluggySyncStep[] = [itemStatusStep, accountCheckStep, importBankTransactionsStep, importCardPurchasesStep, importCardBillsStep, matchBillPaymentsStep, reportCardBillsStep, syncInvestmentPositionsStep, alignReserveCheckpointStep];

const MAX_ATTENTION_ITEMS = 50;
const MAX_INVOICE_ROWS = 50;

type Pipeline = {
  context: PluggySyncStepContext;
  summary: PluggySyncSummary;
  failedItems: Set<string>;
  failedLinks: Set<string>;
};

function emptySummary(dryRun: boolean, items: number, accounts: number): PluggySyncSummary {
  return { dryRun, items: { total: items, failed: 0 }, accounts: { total: accounts, failed: 0, skipped: 0 }, counts: {}, failures: [], attention: [] };
}

function describeFailure(error: unknown) {
  // A database failure would also block the remaining writes, so it stops the run instead of being isolated.
  if (replicaError(error)) throw error;
  return error instanceof DomainError
    ? { code: error.code, message: error.message }
    : { code: "PLUGGY_STEP_FAILED", message: "Não foi possível concluir esta etapa." };
}

function addResult(summary: PluggySyncSummary, result: PluggySyncStepResult) {
  for (const [name, value] of Object.entries(result?.counts ?? {})) summary.counts[name] = (summary.counts[name] ?? 0) + value;
  const attention = (summary.attention ??= []);
  attention.push(...(result?.attention ?? []).slice(0, Math.max(0, MAX_ATTENTION_ITEMS - attention.length)));
  if (result?.invoices?.length) {
    const invoices = (summary.invoices ??= []);
    invoices.push(...result.invoices.slice(0, Math.max(0, MAX_INVOICE_ROWS - invoices.length)));
  }
}

function recordFailure(summary: PluggySyncSummary, failure: Omit<PluggySyncFailure, "code" | "message">, error: unknown) {
  summary.failures.push({ ...failure, ...describeFailure(error) });
}

async function runItemStep(step: Extract<PluggySyncStep, { scope: "item" }>, items: PluggyItemRecord[], state: Pipeline) {
  for (const item of items) {
    if (state.failedItems.has(item.id)) continue;
    try {
      addResult(state.summary, await step.run(state.context, item));
    } catch (error) {
      recordFailure(state.summary, { scope: "item", step: step.name, targetId: item.id, label: item.label }, error);
      state.failedItems.add(item.id);
    }
  }
}

async function runAccountStep(step: Extract<PluggySyncStep, { scope: "account" }>, items: PluggyItemRecord[], links: PluggyLinkRecord[], state: Pipeline) {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  for (const link of links) {
    if (state.failedLinks.has(link.id) || state.failedItems.has(link.itemId)) continue;
    try {
      addResult(state.summary, await step.run(state.context, link, itemsById.get(link.itemId)!));
    } catch (error) {
      recordFailure(state.summary, { scope: "account", step: step.name, targetId: link.id, label: link.remoteName }, error);
      state.failedLinks.add(link.id);
    }
  }
}

function resolveStatus(state: Pipeline): PluggySyncRunStatus {
  const { items, accounts } = state.summary;
  state.summary.items.failed = state.failedItems.size;
  state.summary.accounts.failed = state.failedLinks.size;
  if (!state.summary.failures.length) return "success";
  return state.failedItems.size >= items.total && (accounts.total === 0 || state.failedLinks.size + accounts.skipped >= accounts.total) ? "failed" : "partial";
}

function createContext(options: PluggySyncOptions, dryRun: boolean, now: Date): PluggySyncStepContext {
  const accounts = new Map<string, Promise<PluggyRemoteAccount[]>>();
  const transactions = new Map<string, Promise<PluggyRemoteTransaction[]>>();
  const bills = new Map<string, Promise<PluggyRemoteBill[]>>();
  return {
    db: options.db,
    client: options.client,
    dryRun,
    now,
    async write(mutation) { if (!dryRun) await mutation(options.db); },
    remoteAccounts(item) {
      if (!accounts.has(item.id)) accounts.set(item.id, options.client.listAccounts(item.externalItemId));
      return accounts.get(item.id)!;
    },
    remoteTransactions(link) {
      if (!transactions.has(link.id)) transactions.set(link.id, options.client.listTransactions(link.externalAccountId, link.kind === "credit" ? {} : { from: link.cutoffDate }));
      return transactions.get(link.id)!;
    },
    remoteBills(link) {
      if (!bills.has(link.id)) bills.set(link.id, options.client.listBills(link.externalAccountId));
      return bills.get(link.id)!;
    },
  };
}

async function recordItemOutcomes(db: AppDb, items: PluggyItemRecord[], state: Pipeline, now: Date) {
  for (const item of items) {
    const failure = state.summary.failures.find((entry) => entry.scope === "item" && entry.targetId === item.id);
    await db.update(pluggyItems)
      .set({ lastErrorCode: failure?.code ?? null, updatedAt: now, ...(failure ? {} : { lastSyncedAt: now }) })
      .where(eq(pluggyItems.id, item.id));
  }
}

async function loadTargets(db: AppDb) {
  const [items, links] = await Promise.all([db.query.pluggyItems.findMany(), db.query.pluggyAccountLinks.findMany()]);
  return { items, links: links.filter((link) => link.isEnabled) };
}

async function executeSteps(options: PluggySyncOptions, runId: string | null, startedAt: Date, dryRun: boolean): Promise<PluggySyncRunView> {
  const { items, links } = await loadTargets(options.db);
  const state: Pipeline = {
    context: createContext(options, dryRun, startedAt),
    summary: emptySummary(dryRun, items.length, links.length),
    failedItems: new Set(),
    failedLinks: new Set(),
  };
  for (const step of options.steps ?? pluggySyncSteps) {
    if (step.scope === "item") await runItemStep(step, items, state);
    else await runAccountStep(step, items, links, state);
  }
  state.summary.accounts.skipped = links.filter((link) => state.failedItems.has(link.itemId)).length;
  const status = resolveStatus(state);
  if (!runId) return { id: null, startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(), status, errorCode: null, summary: state.summary };
  await recordItemOutcomes(options.db, items, state, startedAt);
  return closePluggyRun(options.db, runId, status, state.summary, state.summary.failures[0]?.code ?? null);
}

async function executeRun(options: PluggySyncOptions) {
  const dryRun = options.dryRun ?? false;
  const startedAt = new Date();
  const runId = dryRun ? null : await openPluggyRun(options.db, startedAt);
  try {
    return await executeSteps(options, runId, startedAt, dryRun);
  } catch (error) {
    if (runId) await closePluggyRun(options.db, runId, "failed", emptySummary(dryRun, 0, 0), "PLUGGY_SYNC_FAILED").catch(() => undefined);
    throw error;
  }
}

export async function runPluggySync(options: PluggySyncOptions) {
  const runtime = pluggyRuntime();
  if (runtime.syncRunning) throw new DomainError("PLUGGY_SYNC_RUNNING", "Já existe uma sincronização em andamento.", 409);
  runtime.syncRunning = true;
  try {
    return await executeRun(options);
  } finally {
    runtime.syncRunning = false;
  }
}
