import { afterEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { handleMcpRequest } from "@/lib/mcp/http";
import { createTestDatabase } from "@/tests/helpers/database";

const token = "test-token-that-is-at-least-thirty-two-characters";
const originalToken = process.env.PFC_MCP_TOKEN;

afterEach(() => {
  if (originalToken === undefined) delete process.env.PFC_MCP_TOKEN;
  else process.env.PFC_MCP_TOKEN = originalToken;
});

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
  it("disables MCP without a valid configured token", async () => {
    delete process.env.PFC_MCP_TOKEN;
    expect((await handleMcpRequest(request(rpc("initialize"), { token }))).status).toBe(503);
    process.env.PFC_MCP_TOKEN = "short";
    expect((await handleMcpRequest(request(rpc("initialize"), { token }))).status).toBe(503);
  });

  it("rejects missing/invalid authorization, non-loopback hosts, and non-POST methods", async () => {
    process.env.PFC_MCP_TOKEN = token;
    expect((await handleMcpRequest(request(rpc("initialize")))).status).toBe(401);
    expect((await handleMcpRequest(request(rpc("initialize"), { token: `${token}-wrong` }))).status).toBe(401);
    expect((await handleMcpRequest(request(rpc("initialize"), { token, url: "http://finance.test/api/mcp" }))).status).toBe(403);
    expect((await handleMcpRequest(request({}, { token, method: "GET" }))).status).toBe(405);
  });

  it("publishes instructions, tool schemas, and safety annotations", async () => {
    process.env.PFC_MCP_TOKEN = token;
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
    expect(listPayload.result.tools).toHaveLength(11);
    expect(listPayload.result.tools.find((tool: { name: string }) => tool.name === "list_transactions").annotations.readOnlyHint).toBe(true);
    expect(listPayload.result.tools.find((tool: { name: string }) => tool.name === "delete_transaction").annotations.destructiveHint).toBe(true);
    expect(listPayload.result.tools.find((tool: { name: string }) => tool.name === "create_transaction").inputSchema.required).toContain("idempotencyKey");
  });
});

describe("MCP finance tools", () => {
  it("runs idempotent transaction and credit-card CRUD without leaking balances", async () => {
    process.env.PFC_MCP_TOKEN = token;
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
    process.env.PFC_MCP_TOKEN = token;
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
