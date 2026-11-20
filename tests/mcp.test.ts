import { afterEach, describe, expect, it, vi } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { archiveCategory, createCategory } from "@/lib/server/categories";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { saveBudget } from "@/lib/server/budgets";
import { upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { getOrCreatePendingCategory } from "@/lib/server/pending-category";
import { createTransaction } from "@/lib/server/transactions";
import { handleMcpRequest } from "@/lib/mcp/http";
import { createTestDatabase } from "@/tests/helpers/database";

const token = "test-token-that-is-at-least-thirty-two-characters";
vi.mock("@/lib/auth/mcp-token", () => ({ verifyMcpToken: async (authorization: string) => {
  if (process.env.AUTH_TEST_UNAVAILABLE === "1") throw new Error("offline");
  return authorization === "Bearer test-token-that-is-at-least-thirty-two-characters";
} }));
afterEach(() => { delete process.env.AUTH_TEST_UNAVAILABLE; });

function request(body: unknown, options?: { token?: string; url?: string; method?: string }) {
  const headers = new Headers({
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  });
  if (options?.token) headers.set("authorization", `Bearer ${options.token}`);
  return new Request(options?.url ?? "http://127.0.0.1:3007/api/mcp", {
    method: options?.method ?? "POST",
    headers,
    body: options?.method === "GET" ? undefined : JSON.stringify(body),
  });
}

function rpc(method: string, params?: unknown, id = 1) {
  return { jsonrpc: "2.0", id, method, ...(params === undefined ? {} : { params }) };
}

async function callTool(
  db: Awaited<ReturnType<typeof createTestDatabase>>["db"],
  name: string,
  args: Record<string, unknown>
) {
  const response = await handleMcpRequest(
    request(rpc("tools/call", { name, arguments: args }), { token }),
    db
  );
  expect(response.status).toBe(200);
  const payload = await response.json();
  return payload.result;
}

describe("MCP HTTP security and protocol", () => {
  it("blocks MCP when authentication is unavailable", async () => {
    process.env.AUTH_TEST_UNAVAILABLE = "1";
    expect((await handleMcpRequest(request(rpc("initialize"), { token }))).status).toBe(503);
    process.env.AUTH_TEST_UNAVAILABLE = "1";
    expect((await handleMcpRequest(request(rpc("initialize"), { token }))).status).toBe(503);
  });

  it("rejects missing/invalid authorization, non-loopback hosts, and non-POST methods", async () => {
    expect((await handleMcpRequest(request(rpc("initialize")))).status).toBe(401);
    expect((await handleMcpRequest(request(rpc("initialize"), { token: `${token}-wrong` }))).status).toBe(401);
    expect((await handleMcpRequest(request(rpc("initialize"), { token, url: "http://finance.test/api/mcp" }))).status).toBe(403);
    expect((await handleMcpRequest(request({}, { token, method: "GET" }))).status).toBe(405);
  });

  it("publishes instructions, tool schemas, and safety annotations", async () => {
    const initialized = await handleMcpRequest(request(rpc("initialize", {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "vitest", version: "1" },
    }), { token }));
    expect(initialized.status).toBe(200);
    const initPayload = await initialized.json();
    expect(initPayload.result.instructions).toContain("integer cents");

    const listed = await handleMcpRequest(request(rpc("tools/list"), { token }));
    const listPayload = await listed.json();
    expect(listPayload.result.tools).toHaveLength(18);
    expect(listPayload.result.tools.find((tool: { name: string }) => tool.name === "list_transactions").annotations.readOnlyHint).toBe(true);
    expect(listPayload.result.tools.find((tool: { name: string }) => tool.name === "delete_transaction").annotations.destructiveHint).toBe(true);
    expect(listPayload.result.tools.find((tool: { name: string }) => tool.name === "create_transaction").inputSchema.required).toContain("idempotencyKey");
  });
});

describe("MCP finance tools", () => {
  it("runs idempotent transaction and credit-card CRUD without leaking balances", async () => {
    const { db, cleanup } = await createTestDatabase();
    try {
      const checking = await createAccount({ name: "Checking MCP", type: "checking", initialBalanceCents: 1000 }, db);
      const card = await createAccount({ name: "Card MCP", type: "credit", creditClosingDay: 20 }, db);
      const income = await createCategory({ name: "MCP Income", group: "income" }, db);
      const expense = await createCategory({ name: "MCP Expense", group: "variable_expense" }, db);

      const references = await callTool(db, "list_finance_references", {});
      expect(references.structuredContent.data.accounts[0]).not.toHaveProperty("currentBalanceCents");

      const transactionInput = {
        idempotencyKey: "pdf:2026-09:1",
        accountId: checking.id,
        categoryId: income.id,
        type: "income",
        amountCents: 12345,
        transactionDate: "2026-09-02",
        competenceMonth: "2026-09",
        description: "Imported income",
      };
      const created = await callTool(db, "create_transaction", transactionInput);
      expect(created.structuredContent.data.created).toBe(true);
      const repeated = await callTool(db, "create_transaction", transactionInput);
      expect(repeated.structuredContent.data.created).toBe(false);
      const transactionId = created.structuredContent.data.id;
      expect((await callTool(db, "list_transactions", { competenceMonth: "2026-09" })).structuredContent.data).toHaveLength(1);
      expect((await callTool(db, "get_transaction", { id: transactionId })).structuredContent.ok).toBe(true);
      expect((await callTool(db, "update_transaction", { id: transactionId, amountCents: 13000 })).structuredContent.data.amountCents).toBe(13000);

      const conflict = await callTool(db, "create_transaction", { ...transactionInput, amountCents: 1 });
      expect(conflict.isError).toBe(true);
      expect(conflict.structuredContent.code).toBe("IDEMPOTENCY_KEY_CONFLICT");
      expect((await callTool(db, "delete_transaction", { id: transactionId, confirm: true })).structuredContent.data.deleted).toBe(true);

      const chargeInput = {
        idempotencyKey: "pdf:2026-09:2",
        accountId: card.id,
        categoryId: expense.id,
        description: "Imported card purchase",
        purchaseDate: "2026-09-21",
        totalAmountCents: 10001,
        installmentCount: 3,
        kind: "purchase",
      };
      const charge = await callTool(db, "create_credit_card_charge", chargeInput);
      expect(charge.structuredContent.data.installments.map((row: { amountCents: number }) => row.amountCents)).toEqual([3334, 3334, 3333]);
      const chargeId = charge.structuredContent.data.id;
      expect((await callTool(db, "create_credit_card_charge", chargeInput)).structuredContent.data.created).toBe(false);
      expect((await callTool(db, "list_credit_card_charges", { accountId: card.id, invoiceMonth: "2026-10" })).structuredContent.data).toHaveLength(1);
      expect((await callTool(db, "list_credit_card_charges", { accountId: card.id, invoiceMonth: "2027-01" })).structuredContent.data).toHaveLength(0);
      expect((await callTool(db, "update_credit_card_charge", { id: chargeId, description: "Updated" })).structuredContent.data.description).toBe("Updated");
      expect((await callTool(db, "delete_credit_card_charge", { id: chargeId, confirm: true })).structuredContent.data.deleted).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("rejects out-of-scope accounts and requires literal deletion confirmation", async () => {
    const { db, cleanup } = await createTestDatabase();
    try {
      const card = await createAccount({ name: "Wrong account", type: "credit", creditClosingDay: 10 }, db);
      const category = await createCategory({ name: "Wrong category", group: "income" }, db);
      const result = await callTool(db, "create_transaction", {
        idempotencyKey: "pdf:wrong:1", accountId: card.id, categoryId: category.id,
        type: "income", amountCents: 100, transactionDate: "2026-09-01",
        competenceMonth: "2026-09", description: "Wrong",
      });
      expect(result.structuredContent.code).toBe("ACCOUNT_TYPE_MISMATCH");

      const missingConfirmation = await callTool(db, "delete_transaction", { id: crypto.randomUUID(), confirm: false });
      expect(missingConfirmation.isError).toBe(true);
    } finally {
      await cleanup();
    }
  });
});

describe("MCP categorization tools", () => {
  async function setup() {
    const database = await createTestDatabase();
    const { db } = database;
    const checking = await createAccount({ name: "Checking Cat", type: "checking", initialBalanceCents: 0 }, db);
    const card = await createAccount({ name: "Card Cat", type: "credit", creditClosingDay: 25 }, db);
    const food = await createCategory({ name: "Alimentação MCP", group: "variable_expense" }, db);
    const pending = await getOrCreatePendingCategory(db);
    const bank = (fingerprint: string, description: string, transactionDate: string) => createTransaction({
      accountId: checking.id, type: "expense", status: "posted", amountCents: 1000, transactionDate,
      competenceMonth: transactionDate.slice(0, 7), description, importFingerprint: fingerprint,
    }, db);
    const charge = (fingerprint: string, description: string, categoryId = pending.id) => createCreditCardCharge({
      accountId: card.id, categoryId, description, purchaseDate: "2026-03-02", totalAmountCents: 3000,
      installmentCount: 1, importFingerprint: fingerprint,
    }, db);
    return { ...database, checking, card, food, pending, bank, charge };
  }

  it("lists pending groups and categorizes a whole group at once", async () => {
    const { db, cleanup, food, bank, charge } = await setup();
    try {
      await bank("pluggy:bank:1", "IFOOD *RESTAURANTE 10/03", "2026-03-10");
      await bank("pluggy:bank:2", "IFOOD *RESTAURANTE 12/03", "2026-04-12");
      await charge("pluggy:card:1", "UBER *TRIP");

      const listed = await callTool(db, "list_pending_categories", {});
      expect(listed.structuredContent.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ normalizedDescription: "IFOOD *RESTAURANTE", direction: "expense", occurrences: 2, totalCents: 2000 }),
        expect.objectContaining({ normalizedDescription: "UBER *TRIP", occurrences: 1 }),
      ]));

      const applied = await callTool(db, "apply_pending_category", { normalizedDescription: "ifood *restaurante 15/03", direction: "expense", categoryId: food.id });
      expect(applied.structuredContent.data).toEqual({ applied: 2, remainingGroups: 1 });

      const income = await createCategory({ name: "Income MCP", group: "income" }, db);
      const mismatch = await callTool(db, "apply_pending_category", { normalizedDescription: "UBER *TRIP", direction: "expense", categoryId: income.id });
      expect(mismatch.structuredContent.code).toBe("PLUGGY_CATEGORY_RULE_INVALID");
    } finally {
      await cleanup();
    }
  });

  it("filters listings by uncategorized, description text and date range", async () => {
    const { db, cleanup, card, food, pending, bank, charge } = await setup();
    try {
      await bank("pluggy:bank:1", "Açaí da Praça", "2026-03-10");
      await bank("pluggy:bank:2", "Padaria", "2026-04-12");
      const categorized = await charge("pluggy:card:1", "Livraria", food.id);
      await charge("pluggy:card:2", "Farmácia");

      const references = await callTool(db, "list_finance_references", {});
      expect(references.structuredContent.data.categories.find((row: { id: string }) => row.id === pending.id).isPending).toBe(true);

      const all = await callTool(db, "list_transactions", { uncategorized: true });
      expect(all.structuredContent.data).toHaveLength(2);
      const searched = await callTool(db, "list_transactions", { search: "acai" });
      expect(searched.structuredContent.data.map((row: { description: string }) => row.description)).toEqual(["Açaí da Praça"]);
      const ranged = await callTool(db, "list_transactions", { fromDate: "2026-04-01", toDate: "2026-04-30" });
      expect(ranged.structuredContent.data.map((row: { description: string }) => row.description)).toEqual(["Padaria"]);

      const pendingCharges = await callTool(db, "list_credit_card_charges", { uncategorized: true });
      expect(pendingCharges.structuredContent.data.map((row: { description: string }) => row.description)).toEqual(["Farmácia"]);
      const byText = await callTool(db, "list_credit_card_charges", { accountId: card.id, search: "LIVRARIA" });
      expect(byText.structuredContent.data.map((row: { id: string }) => row.id)).toEqual([categorized.id]);
      expect((await callTool(db, "list_credit_card_charges", { toDate: "2026-03-01" })).structuredContent.data).toHaveLength(0);
      const badDate = await callTool(db, "list_transactions", { fromDate: "03/2026" });
      expect(badDate.isError).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it("creates categories once and refuses reserved or near-duplicate names", async () => {
    const { db, cleanup } = await setup();
    try {
      const created = await callTool(db, "create_category", { name: "Pets", group: "variable_expense", description: "Ração e veterinário" });
      expect(created.structuredContent.data).toMatchObject({ name: "Pets", group: "variable_expense", description: "Ração e veterinário", created: true });
      const repeated = await callTool(db, "create_category", { name: "Pets", group: "variable_expense" });
      expect(repeated.structuredContent.data).toMatchObject({ id: created.structuredContent.data.id, created: false });

      expect((await callTool(db, "create_category", { name: "pets", group: "variable_expense" })).structuredContent.code).toBe("CATEGORY_NAME_TAKEN");
      expect((await callTool(db, "create_category", { name: "Pets", group: "fixed_expense" })).structuredContent.code).toBe("CATEGORY_NAME_TAKEN");
      expect((await callTool(db, "create_category", { name: "alimentacao mcp", group: "variable_expense" })).structuredContent.code).toBe("CATEGORY_NAME_TAKEN");
      expect((await callTool(db, "create_category", { name: "a classificar", group: "variable_expense" })).structuredContent.code).toBe("CATEGORY_RESERVED");

      await archiveCategory(created.structuredContent.data.id, db);
      const archived = await callTool(db, "create_category", { name: "Pets", group: "variable_expense" });
      expect(archived.structuredContent).toMatchObject({ code: "CATEGORY_NAME_TAKEN", message: expect.stringContaining("archived") });
    } finally {
      await cleanup();
    }
  });
});

describe("MCP insight tools", () => {
  it("summarizes spending, budgets and card invoices", async () => {
    const { db, cleanup } = await createTestDatabase();
    try {
      const checking = await createAccount({ name: "Checking Insight", type: "checking", initialBalanceCents: 0 }, db);
      const card = await createAccount({ name: "Card Insight", type: "credit", creditClosingDay: 25, creditDueDay: 5 }, db);
      await createAccount({ name: "Other Card", type: "credit", creditClosingDay: 10, creditDueDay: 20 }, db);
      const market = await createCategory({ name: "Mercado Insight", group: "variable_expense" }, db);
      await createTransaction({ accountId: checking.id, categoryId: market.id, type: "expense", status: "posted", amountCents: 12000, transactionDate: "2026-03-10", competenceMonth: "2026-03", description: "Supermercado" }, db);
      await createCreditCardCharge({ accountId: card.id, categoryId: market.id, description: "Atacado", purchaseDate: "2026-03-02", totalAmountCents: 8000, installmentCount: 1, firstInvoiceMonth: "2026-03" }, db);
      await saveBudget({ categoryId: market.id, competenceMonth: "2026-03", amountCents: 25000 }, db);
      await upsertCreditCardBill({ accountId: card.id, invoiceMonth: "2026-03", dueDate: "2026-04-05", statementTotalCents: 8000, currentChargesTotalCents: 8000 }, db);

      const spending = await callTool(db, "get_spending_summary", { fromMonth: "2026-03", type: "expense", categoryIds: [market.id] });
      expect(spending.structuredContent.data.totals).toMatchObject({ expenseCents: 20000, entryCount: 2 });
      expect(spending.structuredContent.data).not.toHaveProperty("entries");
      expect((await callTool(db, "get_spending_summary", { fromMonth: "2026-13" })).isError).toBe(true);

      const budget = await callTool(db, "get_budget_overview", { competenceMonth: "2026-03" });
      expect(budget.structuredContent.data.rows).toEqual([expect.objectContaining({ categoryId: market.id, limitCents: 25000, committedCents: 20000, expenseCount: 2, state: "warning" })]);
      expect(budget.structuredContent.data.rows[0]).not.toHaveProperty("expenses");

      const invoices = await callTool(db, "get_credit_card_invoices", { invoiceMonth: "2026-03" });
      expect(invoices.structuredContent.data.map((row: { accountName: string }) => row.accountName).sort()).toEqual(["Card Insight", "Other Card"]);
      const single = await callTool(db, "get_credit_card_invoices", { invoiceMonth: "2026-03", accountId: card.id });
      expect(single.structuredContent.data).toEqual([expect.objectContaining({
        accountId: card.id, totalAmountCents: 8000, purchaseCount: 1, dueDay: 5,
        bill: expect.objectContaining({ status: "open", dueDate: "2026-04-05", statementTotalCents: 8000 }),
        categoryTotals: [expect.objectContaining({ categoryId: market.id, amountCents: 8000 })],
      })]);
      expect((await callTool(db, "get_credit_card_invoices", { invoiceMonth: "2026-03", accountId: checking.id })).structuredContent.code).toBe("ACCOUNT_TYPE_MISMATCH");
    } finally {
      await cleanup();
    }
  });
});
