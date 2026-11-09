import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { aggregateDashboardCategories } from "@/lib/dashboard-aggregation";
import { categories, pluggyAccountLinks, pluggyCategoryRules, pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import { PENDING_CATEGORY_NAME } from "@/lib/pending-category";
import { createAccount } from "@/lib/server/accounts";
import { archiveCategory, createCategory, deleteCategory, updateCategory } from "@/lib/server/categories";
import { createCreditCardCharge, getCreditCardCharge, updateCreditCardCharge } from "@/lib/server/credit-card";
import { getMonthlyDashboard } from "@/lib/server/dashboard";
import { findPendingCategory, getOrCreatePendingCategory } from "@/lib/server/pending-category";
import { applyPendingCategory, listPendingCategoryGroups } from "@/lib/server/pluggy/category-review";
import { categoryFitsDirection, isRuleDirection, loadCategoryRuleIndex, resolveCardCategoryId, resolveRuleCategory, upsertCategoryRule } from "@/lib/server/pluggy/category-rules";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { getReport } from "@/lib/server/reports";
import { createTransaction, listTransactions, updateTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;

const MONTH = "2026-03";
let database: Database;
let checking: string;
let card: string;
let food: string;
let rent: string;
let salary: string;
let feed: PluggyRemoteTransaction[];

const db = () => database.db;
const bank = (fingerprint: string | undefined, description: string, overrides: Record<string, unknown> = {}) => createTransaction({
  accountId: checking, type: "expense", status: "posted", amountCents: 1000, transactionDate: `${MONTH}-10`, competenceMonth: MONTH, description,
  ...(fingerprint ? { importFingerprint: fingerprint } : {}), ...overrides,
}, db());
const charge = async (fingerprint: string | undefined, description: string, categoryId?: string) => createCreditCardCharge({
  accountId: card, categoryId: categoryId ?? (await getOrCreatePendingCategory(db())).id, description, purchaseDate: `${MONTH}-02`, totalAmountCents: 3000, installmentCount: 1, firstInvoiceMonth: MONTH,
  ...(fingerprint ? { importFingerprint: fingerprint } : {}),
}, db());
const categoryOf = async (id: string) => (await db().query.transactions.findFirst({ where: (table, { eq }) => eq(table.id, id) }))?.categoryId;
const rules = () => db().query.pluggyCategoryRules.findMany();
const failRuleWrites = () => db().$client.execute("CREATE TRIGGER fail_rules BEFORE INSERT ON pluggy_category_rules BEGIN SELECT RAISE(ABORT, 'rule write failed'); END");

function api(): PluggyApi {
  return {
    getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED" })),
    listAccounts: vi.fn(async () => [{ id: "remote-a", type: "BANK", name: "A" }]),
    listTransactions: vi.fn(async () => feed),
    listBills: vi.fn(async () => []),
    listInvestments: vi.fn(async () => []),
  };
}
const remote = (id: string, overrides: Partial<PluggyRemoteTransaction> = {}): PluggyRemoteTransaction => ({ id, date: "2026-03-10T15:00:00.000Z", amount: -100, type: "DEBIT", status: "POSTED", description: "MERCADO BOM", operationType: "OUTROS", ...overrides });
const sync = (dryRun = false) => runPluggySync({ db: db(), client: api(), dryRun });
const synced = (fingerprint: string) => db().query.transactions.findFirst({ where: (table, { eq }) => eq(table.importFingerprint, fingerprint) });

beforeEach(async () => {
  database = await createTestDatabase();
  checking = (await createAccount({ name: "Corrente", type: "checking", initialBalanceCents: 0 }, db())).id;
  card = (await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 25, creditDueDay: 5 }, db())).id;
  food = (await createCategory({ name: "Mercado teste", group: "variable_expense" }, db())).id;
  rent = (await createCategory({ name: "Aluguel teste", group: "fixed_expense" }, db())).id;
  salary = (await createCategory({ name: "Renda teste", group: "income" }, db())).id;
  feed = [];
  pluggyRuntime().syncRunning = false;
});

afterEach(async () => {
  db().$client.close();
  await database.cleanup();
});

describe("category rules", () => {
  it("creates, updates and finds a rule through its hash over encrypted values", async () => {
    await upsertCategoryRule(db(), { normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: food });
    await upsertCategoryRule(db(), { normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: rent });
    expect(await rules()).toMatchObject([{ normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: rent }]);
    const { rows } = await db().$client.execute("SELECT normalized_description, normalized_description_hash, direction FROM pluggy_category_rules");
    expect(rows[0].normalized_description).toMatch(/^pfc:v2:/);
    expect(rows[0].direction).toMatch(/^pfc:v2:/);
    expect(rows[0].normalized_description_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(rows)).not.toContain("MERCADO");
  });

  it("keeps income and expense rules with the same description apart", async () => {
    await upsertCategoryRule(db(), { normalizedDescription: "PIX LOJA", direction: "expense", categoryId: food });
    await upsertCategoryRule(db(), { normalizedDescription: "PIX LOJA", direction: "income", categoryId: salary });
    const index = await loadCategoryRuleIndex(db());
    expect(await rules()).toHaveLength(2);
    expect(resolveRuleCategory(index, "pix loja 15/03", "expense")).toBe(food);
    expect(resolveRuleCategory(index, "Pix Loja", "income")).toBe(salary);
    expect(resolveRuleCategory(index, "Outra loja", "income")).toBeNull();
  });

  it("rejects a duplicate through the unique index", async () => {
    await db().insert(pluggyCategoryRules).values({ normalizedDescription: "X", direction: "expense", categoryId: food });
    await expect(db().insert(pluggyCategoryRules).values({ normalizedDescription: "X", direction: "expense", categoryId: rent })).rejects.toThrow();
  });

  it("ignores a rule whose category was archived or moved to another group", async () => {
    await upsertCategoryRule(db(), { normalizedDescription: "ARQUIVADA", direction: "expense", categoryId: food });
    await upsertCategoryRule(db(), { normalizedDescription: "REGRUPADA", direction: "expense", categoryId: rent });
    await archiveCategory(food, db());
    await updateCategory({ id: rent, group: "income" }, db());
    expect((await loadCategoryRuleIndex(db())).size).toBe(0);
  });

  it("classifies which categories fit a direction", () => {
    const category = (group: "income" | "fixed_expense" | "variable_expense" | "investment", name = "X", isArchived = false) => ({ name, group, isArchived });
    expect(categoryFitsDirection(category("income"), "income")).toBe(true);
    expect(categoryFitsDirection(category("fixed_expense"), "income")).toBe(false);
    expect(categoryFitsDirection(category("fixed_expense"), "expense")).toBe(true);
    expect(categoryFitsDirection(category("variable_expense"), "expense")).toBe(true);
    expect(categoryFitsDirection(category("investment"), "expense")).toBe(false);
    expect(categoryFitsDirection(category("variable_expense", PENDING_CATEGORY_NAME), "expense")).toBe(false);
    expect(categoryFitsDirection(category("variable_expense", "X", true), "expense")).toBe(false);
    expect(isRuleDirection("investment_contribution")).toBe(false);
  });

  it("blocks deleting a category that a rule still uses, with a domain error", async () => {
    await upsertCategoryRule(db(), { normalizedDescription: "X", direction: "expense", categoryId: food });
    await expect(deleteCategory(food, db())).rejects.toMatchObject({ code: "CATEGORY_IN_USE" });
  });
});

describe("pending category", () => {
  it("creates it once and reuses it", async () => {
    const first = await getOrCreatePendingCategory(db());
    const second = await getOrCreatePendingCategory(db());
    expect(second.id).toBe(first.id);
    expect(first).toMatchObject({ name: PENDING_CATEGORY_NAME, group: "variable_expense", isArchived: false });
    expect((await db().query.categories.findMany()).filter((row) => row.name === PENDING_CATEGORY_NAME)).toHaveLength(1);
  });

  it("reuses one that already exists and restores it when archived", async () => {
    const existing = await createCategory({ name: PENDING_CATEGORY_NAME, group: "variable_expense" }, db());
    await archiveCategory(existing.id, db());
    await expect(getOrCreatePendingCategory(db())).resolves.toMatchObject({ id: existing.id, isArchived: false });
  });

  it("refuses a same-named category from another group", async () => {
    await db().insert(categories).values({ name: PENDING_CATEGORY_NAME, group: "income" });
    await expect(getOrCreatePendingCategory(db())).rejects.toMatchObject({ code: "PENDING_CATEGORY_CONFLICT" });
    await expect(findPendingCategory(db())).resolves.toBeNull();
  });

  it("is what a card purchase uses without a rule", async () => {
    await upsertCategoryRule(db(), { normalizedDescription: "LOJA CONHECIDA", direction: "expense", categoryId: food });
    const index = await loadCategoryRuleIndex(db());
    expect(await resolveCardCategoryId(db(), index, "Loja Conhecida PARC 01/02")).toBe(food);
    expect(await resolveCardCategoryId(db(), index, "Loja nova")).toBe((await findPendingCategory(db()))?.id);
  });

  it("counts as uncategorized in the filter, the notice and the group totals", async () => {
    const pending = await getOrCreatePendingCategory(db());
    const none = await bank("pluggy:bank:a", "SEM CATEGORIA");
    const placeholder = await bank("pluggy:bank:b", "MARCADA", { categoryId: pending.id });
    await bank("pluggy:bank:c", "CATEGORIZADA", { categoryId: food });
    await charge("pluggy:card:a", "COMPRA CARTAO");
    expect((await listTransactions({ uncategorized: true }, db())).map((row) => row.id).sort()).toEqual([none.id, placeholder.id].sort());
    const { totals } = (await getMonthlyDashboard(MONTH, db()));
    expect(totals).toMatchObject({ uncategorizedExpenseCents: 5000, variableExpenseCents: 1000, fixedExpenseCents: 0 });
  });

  it("leaves the filter as it was when the category does not exist", async () => {
    const none = await bank(undefined, "MANUAL");
    await bank(undefined, "CATEGORIZADA", { categoryId: food });
    expect((await listTransactions({ uncategorized: true }, db())).map((row) => row.id)).toEqual([none.id]);
  });

  it("is left out of category totals that exclude uncategorized spending", () => {
    const expense = { id: "1", amountCents: 100, description: "x", expenseDate: "2026-03-01", competenceMonth: MONTH, account: null };
    const placeholder = { ...expense, category: { id: "p", name: PENDING_CATEGORY_NAME, group: "variable_expense" } } as Parameters<typeof aggregateDashboardCategories>[0][number];
    expect(aggregateDashboardCategories([placeholder], false)).toEqual([]);
    expect(aggregateDashboardCategories([placeholder], true)).toHaveLength(1);
  });
});

describe("learning from updates", () => {
  it("applies a category to imported records still uncategorized with the same description", async () => {
    const [first, second, third, other] = [await bank("pluggy:bank:1", "Mercado Bom 10/03"), await bank("pluggy:bank:2", "MERCADO BOM 11/03"), await bank("pluggy:bank:3", "mercado bom"), await bank("pluggy:bank:4", "Padaria")];
    await updateTransaction({ id: first.id, categoryId: food }, db());
    expect(await rules()).toMatchObject([{ normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: food }]);
    expect([await categoryOf(second.id), await categoryOf(third.id), await categoryOf(other.id)]).toEqual([food, food, null]);
  });

  it("applies an expense rule to pending card purchases and never to chosen ones", async () => {
    const pendingCharge = await charge("pluggy:card:1", "MERCADO BOM PARC 01/03");
    const chosen = await charge("pluggy:card:2", "MERCADO BOM", rent);
    const first = await bank("pluggy:bank:1", "Mercado Bom");
    await updateTransaction({ id: first.id, categoryId: food }, db());
    expect((await getCreditCardCharge(pendingCharge.id, db())).categoryId).toBe(food);
    expect((await getCreditCardCharge(chosen.id, db())).categoryId).toBe(rent);
  });

  it("never replaces a category the user chose", async () => {
    const chosen = await bank("pluggy:bank:1", "Mercado Bom", { categoryId: rent });
    const source = await bank("pluggy:bank:2", "Mercado Bom");
    await updateTransaction({ id: source.id, categoryId: food }, db());
    expect(await categoryOf(chosen.id)).toBe(rent);
  });

  it("updates the rule when the user changes their mind", async () => {
    const row = await bank("pluggy:bank:1", "Mercado Bom");
    await updateTransaction({ id: row.id, categoryId: food }, db());
    await updateTransaction({ id: row.id, categoryId: rent }, db());
    expect(await rules()).toMatchObject([{ categoryId: rent }]);
  });

  it("does not apply an income rule to an expense with the same text", async () => {
    const income = await bank("pluggy:bank:1", "Pix Loja", { type: "income" });
    const expense = await bank("pluggy:bank:2", "Pix Loja");
    await updateTransaction({ id: income.id, categoryId: salary }, db());
    expect(await categoryOf(expense.id)).toBeNull();
    expect(await rules()).toMatchObject([{ direction: "income", categoryId: salary }]);
  });

  it("creates no rule when the category is cleared", async () => {
    const row = await bank("pluggy:bank:1", "Mercado Bom", { categoryId: food });
    await updateTransaction({ id: row.id, categoryId: null }, db());
    expect(await rules()).toEqual([]);
  });

  it("creates no rule when the category is unchanged or only other fields change", async () => {
    const row = await bank("pluggy:bank:1", "Mercado Bom", { categoryId: food });
    await updateTransaction({ id: row.id, categoryId: food, notes: "nota" }, db());
    await updateTransaction({ id: row.id, description: "Outro nome" }, db());
    expect(await rules()).toEqual([]);
  });

  it("creates no rule from the placeholder category", async () => {
    const pending = await getOrCreatePendingCategory(db());
    const row = await bank("pluggy:bank:1", "Mercado Bom");
    await updateTransaction({ id: row.id, categoryId: pending.id }, db());
    expect(await rules()).toEqual([]);
  });

  it("uses the previous description when both change together", async () => {
    const row = await bank("pluggy:bank:1", "Mercado Bom");
    await updateTransaction({ id: row.id, categoryId: food, description: "Meu nome" }, db());
    expect(await rules()).toMatchObject([{ normalizedDescription: "MERCADO BOM" }]);
  });

  it("creates no rule and changes nothing for manually created records", async () => {
    const manual = await bank(undefined, "Mercado Bom");
    const otherManual = await bank(undefined, "Mercado Bom");
    const manualCharge = await charge(undefined, "Mercado Bom", rent);
    await updateTransaction({ id: manual.id, categoryId: food }, db());
    await updateCreditCardCharge({ id: manualCharge.id, categoryId: food }, db());
    expect(await rules()).toEqual([]);
    expect(await categoryOf(otherManual.id)).toBeNull();
  });

  it("leaves manually created records out when an imported record teaches a rule", async () => {
    const manual = await bank(undefined, "Mercado Bom");
    const imported = await bank("pluggy:bank:1", "Mercado Bom");
    await updateTransaction({ id: imported.id, categoryId: food }, db());
    expect(await categoryOf(manual.id)).toBeNull();
  });

  it("learns from a card purchase", async () => {
    const source = await charge("pluggy:card:1", "Loja Nova PARC 01/02");
    const twin = await charge("pluggy:card:2", "Loja Nova PARC 02/02");
    const statement = await bank("pluggy:bank:1", "Loja Nova");
    await updateCreditCardCharge({ id: source.id, categoryId: rent }, db());
    expect(await rules()).toMatchObject([{ normalizedDescription: "LOJA NOVA", direction: "expense", categoryId: rent }]);
    expect((await getCreditCardCharge(twin.id, db())).categoryId).toBe(rent);
    expect(await categoryOf(statement.id)).toBe(rent);
  });

  it("rolls back the category when the rule cannot be written", async () => {
    const row = await bank("pluggy:bank:1", "Mercado Bom");
    await failRuleWrites();
    await expect(updateTransaction({ id: row.id, categoryId: food }, db())).rejects.toThrow();
    expect(await categoryOf(row.id)).toBeNull();
  });

  it("rolls back a card purchase when the rule cannot be written", async () => {
    const pending = await charge("pluggy:card:1", "Loja");
    await failRuleWrites();
    await expect(updateCreditCardCharge({ id: pending.id, categoryId: food }, db())).rejects.toThrow();
    expect((await getCreditCardCharge(pending.id, db())).category).toMatchObject({ name: PENDING_CATEGORY_NAME });
  });

  it("writes no rule when the update itself fails", async () => {
    const row = await bank("pluggy:bank:1", "Mercado Bom");
    await expect(updateTransaction({ id: row.id, categoryId: salary }, db())).rejects.toMatchObject({ code: "CATEGORY_TYPE_MISMATCH" });
    expect(await rules()).toEqual([]);
    const pending = await charge("pluggy:card:1", "Loja");
    await expect(updateCreditCardCharge({ id: pending.id, categoryId: salary }, db())).rejects.toMatchObject({ code: "CATEGORY_TYPE_MISMATCH" });
    expect(await rules()).toEqual([]);
  });
});

describe("import resolver", () => {
  beforeEach(async () => {
    const [{ id: itemId }] = await db().insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
    await db().insert(pluggyAccountLinks).values({ itemId, externalAccountId: "remote-a", accountId: checking, remoteName: "A", kind: "bank", cutoffDate: "2026-01-01" });
  });

  it("categorizes a matching record created by a later sync", async () => {
    feed = [remote("t1")];
    await sync();
    await updateTransaction({ id: (await synced("pluggy:bank:t1"))!.id, categoryId: food }, db());
    feed = [remote("t1"), remote("t2", { description: "Mercado Bom 12/03" }), remote("t3", { description: "Padaria" }), remote("t4", { type: "CREDIT", amount: 100, description: "MERCADO BOM" })];
    await sync();
    expect((await synced("pluggy:bank:t2"))?.categoryId).toBe(food);
    expect((await synced("pluggy:bank:t3"))?.categoryId).toBeNull();
    expect((await synced("pluggy:bank:t4"))?.categoryId).toBeNull();
  });

  it("keeps a user category across a later sync, even after the rule changes", async () => {
    feed = [remote("t1", { status: "PENDING" }), remote("t2")];
    await sync();
    const [first, second] = [await synced("pluggy:bank:t1"), await synced("pluggy:bank:t2")];
    await updateTransaction({ id: first!.id, categoryId: rent }, db());
    expect((await synced("pluggy:bank:t2"))?.categoryId).toBe(rent);
    await updateTransaction({ id: second!.id, categoryId: food }, db());
    feed = [remote("t1"), remote("t2")];
    await sync();
    expect((await synced("pluggy:bank:t1"))?.categoryId).toBe(rent);
    expect((await synced("pluggy:bank:t2"))?.categoryId).toBe(food);
  });

  it("imports without a category when the rule's category was archived", async () => {
    await upsertCategoryRule(db(), { normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: food });
    await archiveCategory(food, db());
    feed = [remote("t1")];
    const run = await sync();
    expect(run.summary?.failures).toEqual([]);
    expect((await synced("pluggy:bank:t1"))?.categoryId).toBeNull();
  });

  it("writes nothing on a dry run", async () => {
    await upsertCategoryRule(db(), { normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: food });
    feed = [remote("t1")];
    await sync(true);
    expect(await synced("pluggy:bank:t1")).toBeUndefined();
  });

  it("moves report totals from unclassified to the chosen group", async () => {
    feed = [remote("t1"), remote("t2")];
    await sync();
    const before = (await getReport({ mode: "monthly", period: MONTH }, db())).totals;
    expect(before).toMatchObject({ uncategorizedExpenseCents: 20000, variableExpenseCents: 0, fixedExpenseCents: 0 });
    await applyPendingCategory({ normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: rent }, db());
    const after = (await getReport({ mode: "monthly", period: MONTH }, db())).totals;
    expect(after).toMatchObject({ uncategorizedExpenseCents: 0, variableExpenseCents: 0, fixedExpenseCents: 20000 });
  });
});

describe("review list", () => {
  it("is empty without pending records", async () => {
    await expect(listPendingCategoryGroups(db())).resolves.toEqual([]);
  });

  it("groups by description and direction, with count and total", async () => {
    await bank("pluggy:bank:1", "Mercado Bom 10/03", { amountCents: 1000 });
    await bank("pluggy:bank:2", "MERCADO BOM", { amountCents: 2500 });
    await bank("pluggy:bank:3", "Mercado Bom", { type: "income", amountCents: 700 });
    await charge("pluggy:card:1", "Mercado Bom PARC 01/02");
    await expect(listPendingCategoryGroups(db())).resolves.toEqual([
      { normalizedDescription: "MERCADO BOM", direction: "expense", occurrences: 3, totalCents: 6500 },
      { normalizedDescription: "MERCADO BOM", direction: "income", occurrences: 1, totalCents: 700 },
    ]);
  });

  it("leaves out categorized, manual, cancelled and investment records", async () => {
    await bank("pluggy:bank:1", "Categorizada", { categoryId: food });
    await bank(undefined, "Manual");
    await bank("pluggy:bank:2", "Cancelada", { status: "cancelled" });
    await charge(undefined, "Manual cartão");
    await expect(listPendingCategoryGroups(db())).resolves.toEqual([]);
  });

  it("creates the rule and applies it to every matching record, leaving the rest pending", async () => {
    const [first, cancelled, other] = [await bank("pluggy:bank:1", "Mercado Bom"), await bank("pluggy:bank:2", "Mercado Bom", { status: "cancelled" }), await bank("pluggy:bank:3", "Padaria")];
    const pendingCharge = await charge("pluggy:card:1", "Mercado Bom");
    const result = await applyPendingCategory({ normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: food }, db());
    expect(result.applied).toBe(3);
    expect(result.pending.map((group) => group.normalizedDescription)).toEqual(["PADARIA"]);
    expect(await rules()).toMatchObject([{ normalizedDescription: "MERCADO BOM", categoryId: food }]);
    expect([await categoryOf(first.id), await categoryOf(cancelled.id), await categoryOf(other.id)]).toEqual([food, food, null]);
    expect((await getCreditCardCharge(pendingCharge.id, db())).categoryId).toBe(food);
  });

  it.each([
    ["an income category for an expense", () => salary, "expense"],
    ["an expense category for income", () => food, "income"],
  ] as const)("rejects %s", async (_name, categoryId, direction) => {
    await expect(applyPendingCategory({ normalizedDescription: "X", direction, categoryId: categoryId() }, db())).rejects.toMatchObject({ code: "PLUGGY_CATEGORY_RULE_INVALID" });
    expect(await rules()).toEqual([]);
  });

  it("rejects an archived, a placeholder or a missing category", async () => {
    await archiveCategory(rent, db());
    const pending = await getOrCreatePendingCategory(db());
    for (const categoryId of [rent, pending.id, "missing"]) {
      await expect(applyPendingCategory({ normalizedDescription: "X", direction: "expense", categoryId }, db())).rejects.toMatchObject({ code: "PLUGGY_CATEGORY_RULE_INVALID" });
    }
    expect(await rules()).toEqual([]);
  });

  it("keeps records unchanged when applying fails", async () => {
    const row = await bank("pluggy:bank:1", "Mercado Bom");
    await failRuleWrites();
    await expect(applyPendingCategory({ normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: food }, db())).rejects.toThrow();
    expect(await categoryOf(row.id)).toBeNull();
  });
});
