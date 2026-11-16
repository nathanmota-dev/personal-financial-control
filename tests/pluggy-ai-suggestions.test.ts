import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AiCategoryRequest, AiCategorySuggestion, CategorySuggester } from "@/lib/interfaces/ai-categorization";
import { createAccount } from "@/lib/server/accounts";
import { suggestPendingCategories } from "@/lib/server/ai/categorize-pending";
import { createCategory, deleteCategory, updateCategory } from "@/lib/server/categories";
import { applyPendingCategory, listPendingCategoryGroups } from "@/lib/server/pluggy/category-review";
import { upsertCategoryRule } from "@/lib/server/pluggy/category-rules";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { createTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;

let database: Database;
let checking: string;
let food: string;
let health: string;
let salary: string;

const db = () => database.db;
const bank = (fingerprint: string, description: string, overrides: Record<string, unknown> = {}) => createTransaction({
  accountId: checking, type: "expense", status: "posted", amountCents: 1000, transactionDate: "2026-03-10", competenceMonth: "2026-03", description, importFingerprint: fingerprint, ...overrides,
}, db());
const suggestions = () => db().query.pluggyCategorySuggestions.findMany();
const client = () => ({
  getItem: vi.fn(), listAccounts: vi.fn(async () => []), listTransactions: vi.fn(async () => []), listBills: vi.fn(async () => []), listInvestments: vi.fn(async () => []),
});

/** Answers from a fixed map of normalized description to category id; anything else is "unknown". */
function fakeSuggester(answers: Record<string, string | null> = {}) {
  const suggest = vi.fn(async (request: AiCategoryRequest): Promise<AiCategorySuggestion[]> => request.pending.map((group) => {
    const categoryId = answers[group.normalizedDescription] ?? null;
    return { normalizedDescription: group.normalizedDescription, direction: group.direction, categoryId, reason: categoryId ? "Farmácia" : null, confidence: categoryId ? 0.9 : 0 };
  }));
  return { suggest } satisfies CategorySuggester;
}

function enableAi() {
  vi.stubEnv("AI_PROVIDER", "google");
  vi.stubEnv("AI_MODEL", "test-model");
  vi.stubEnv("AI_API_KEY", "test-key");
}

beforeEach(async () => {
  database = await createTestDatabase();
  checking = (await createAccount({ name: "Corrente", type: "checking", initialBalanceCents: 0 }, db())).id;
  food = (await createCategory({ name: "Mercado teste", group: "variable_expense", description: "supermercado e padaria" }, db())).id;
  health = (await createCategory({ name: "Saúde teste", group: "variable_expense" }, db())).id;
  salary = (await createCategory({ name: "Renda teste", group: "income" }, db())).id;
  pluggyRuntime().syncRunning = false;
  vi.stubEnv("AI_PROVIDER", "");
  vi.stubEnv("AI_MODEL", "");
  vi.stubEnv("AI_API_KEY", "");
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  db().$client.close();
  await database.cleanup();
});

describe("AI category suggestions during sync", () => {
  it("never calls the suggester when AI is not configured", async () => {
    await bank("pluggy:bank:1", "DROGA RAIA 2231");
    const suggester = fakeSuggester({ "DROGA RAIA": health });
    const run = await runPluggySync({ db: db(), client: client(), suggester });
    expect(suggester.suggest).not.toHaveBeenCalled();
    expect(run.summary?.counts.aiSuggested).toBeUndefined();
    expect(await suggestions()).toEqual([]);
  });

  it("never calls the suggester on a dry run", async () => {
    enableAi();
    await bank("pluggy:bank:1", "DROGA RAIA");
    const suggester = fakeSuggester({ "DROGA RAIA": health });
    await runPluggySync({ db: db(), client: client(), suggester, dryRun: true });
    expect(suggester.suggest).not.toHaveBeenCalled();
  });

  it("stores suggestions, shows them in the review list and counts them in the run", async () => {
    enableAi();
    await bank("pluggy:bank:1", "DROGA RAIA");
    await bank("pluggy:bank:2", "PIX ENVIADO MARIA");
    const suggester = fakeSuggester({ "DROGA RAIA": health });
    const run = await runPluggySync({ db: db(), client: client(), suggester });
    expect(run.status).toBe("success");
    expect(run.summary?.counts).toMatchObject({ aiAttempted: 2, aiSuggested: 1 });
    const groups = await listPendingCategoryGroups(db());
    expect(groups.find((group) => group.normalizedDescription === "DROGA RAIA")?.suggestion).toEqual({ categoryId: health, reason: "Farmácia" });
    expect(groups.find((group) => group.normalizedDescription === "PIX ENVIADO MARIA")).not.toHaveProperty("suggestion");
    const { rows } = await db().$client.execute("SELECT normalized_description, reason, confidence FROM pluggy_category_suggestions");
    expect(rows.every((row) => String(row.normalized_description).startsWith("pfc:v2:") && String(row.confidence).startsWith("pfc:v2:"))).toBe(true);
  });

  it("asks only about descriptions it was never asked about, including the unknown ones", async () => {
    enableAi();
    await bank("pluggy:bank:1", "DROGA RAIA");
    await bank("pluggy:bank:2", "PIX ENVIADO MARIA");
    const suggester = fakeSuggester({ "DROGA RAIA": health });
    await runPluggySync({ db: db(), client: client(), suggester });
    await runPluggySync({ db: db(), client: client(), suggester });
    expect(suggester.suggest).toHaveBeenCalledTimes(1);
    await bank("pluggy:bank:3", "PADARIA CENTRAL");
    await runPluggySync({ db: db(), client: client(), suggester });
    expect(suggester.suggest).toHaveBeenCalledTimes(2);
    expect(suggester.suggest.mock.calls[1][0].pending.map((group) => group.normalizedDescription)).toEqual(["PADARIA CENTRAL"]);
  });

  it("keeps the sync outcome when the suggester fails", async () => {
    enableAi();
    await bank("pluggy:bank:1", "DROGA RAIA");
    const suggester = { suggest: vi.fn(async () => { throw new Error("provider down"); }) };
    const run = await runPluggySync({ db: db(), client: client(), suggester });
    expect(run.status).toBe("success");
    expect(run.summary?.failures).toEqual([]);
    expect(await suggestions()).toEqual([]);
  });

  it("schedules the suggestions after the response when a defer function is given", async () => {
    enableAi();
    await bank("pluggy:bank:1", "DROGA RAIA");
    const suggester = fakeSuggester({ "DROGA RAIA": health });
    const tasks: (() => Promise<void>)[] = [];
    const run = await runPluggySync({ db: db(), client: client(), suggester, defer: (task) => { tasks.push(task); } });
    expect(tasks).toHaveLength(1);
    expect(suggester.suggest).not.toHaveBeenCalled();
    expect(run.summary?.counts.aiSuggested).toBeUndefined();
    await tasks[0]();
    expect(await suggestions()).toMatchObject([{ normalizedDescription: "DROGA RAIA", categoryId: health }]);
  });

  it("never schedules anything when AI is not configured", async () => {
    await bank("pluggy:bank:1", "DROGA RAIA");
    const defer = vi.fn();
    await runPluggySync({ db: db(), client: client(), suggester: fakeSuggester(), defer });
    expect(defer).not.toHaveBeenCalled();
  });

  it("swallows a failure inside a deferred task", async () => {
    enableAi();
    await bank("pluggy:bank:1", "DROGA RAIA");
    const tasks: (() => Promise<void>)[] = [];
    const suggester = { suggest: vi.fn(async () => { throw new Error("provider down"); }) };
    await runPluggySync({ db: db(), client: client(), suggester, defer: (task) => { tasks.push(task); } });
    await expect(tasks[0]()).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith("[ai] Não foi possível sugerir categorias: Error.");
  });
});

describe("what the suggester receives", () => {
  it("sends usable categories with descriptions, confirmed rules as examples and pending groups without amounts", async () => {
    await upsertCategoryRule(db(), { normalizedDescription: "DROGASIL", direction: "expense", categoryId: health });
    await bank("pluggy:bank:1", "Droga Raia 10/03", { amountCents: 4590 });
    await bank("pluggy:bank:2", "DROGA RAIA", { amountCents: 1200 });
    const suggester = fakeSuggester();
    await suggestPendingCategories(db(), suggester);
    const [request] = suggester.suggest.mock.calls[0];
    expect(request.categories).toEqual(expect.arrayContaining([
      { id: food, name: "Mercado teste", group: "variable_expense", description: "supermercado e padaria" },
      { id: salary, name: "Renda teste", group: "income", description: null },
    ]));
    expect(request.categories.every((category) => category.group !== "investment")).toBe(true);
    expect(request.examples).toEqual([{ normalizedDescription: "DROGASIL", direction: "expense", categoryId: health }]);
    expect(request.pending).toEqual([{ normalizedDescription: "DROGA RAIA", direction: "expense", sampleDescription: "Droga Raia 10/03", occurrences: 2 }]);
    expect(JSON.stringify(request)).not.toMatch(/4590|1200|2026-03|Corrente/);
  });

  it("does nothing without pending groups", async () => {
    const suggester = fakeSuggester();
    await expect(suggestPendingCategories(db(), suggester)).resolves.toEqual({ aiAttempted: 0, aiSuggested: 0 });
    expect(suggester.suggest).not.toHaveBeenCalled();
  });
});

describe("suggestion lifecycle", () => {
  it("accepting creates the rule through the normal flow and removes the suggestion", async () => {
    await bank("pluggy:bank:1", "DROGA RAIA");
    await suggestPendingCategories(db(), fakeSuggester({ "DROGA RAIA": health }));
    const result = await applyPendingCategory({ normalizedDescription: "DROGA RAIA", direction: "expense", categoryId: health }, db());
    expect(result.applied).toBe(1);
    expect(result.pending).toEqual([]);
    expect(await suggestions()).toEqual([]);
  });

  it("choosing another category also removes the suggestion", async () => {
    await bank("pluggy:bank:1", "DROGA RAIA");
    await suggestPendingCategories(db(), fakeSuggester({ "DROGA RAIA": health }));
    await applyPendingCategory({ normalizedDescription: "DROGA RAIA", direction: "expense", categoryId: food }, db());
    expect(await suggestions()).toEqual([]);
  });

  it("deleting the suggested category removes the suggestion so the description can be asked again", async () => {
    const extra = (await createCategory({ name: "Farmácia teste", group: "variable_expense" }, db())).id;
    await bank("pluggy:bank:1", "DROGA RAIA");
    await suggestPendingCategories(db(), fakeSuggester({ "DROGA RAIA": extra }));
    await deleteCategory(extra, db());
    expect(await suggestions()).toEqual([]);
    const suggester = fakeSuggester();
    await suggestPendingCategories(db(), suggester);
    expect(suggester.suggest).toHaveBeenCalledTimes(1);
  });

  it("hides a suggestion whose category was moved to another group", async () => {
    await bank("pluggy:bank:1", "DROGA RAIA");
    await suggestPendingCategories(db(), fakeSuggester({ "DROGA RAIA": health }));
    await updateCategory({ id: health, group: "investment" }, db());
    expect((await listPendingCategoryGroups(db()))[0]).not.toHaveProperty("suggestion");
  });
});
