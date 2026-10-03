import { test, expect } from "./helpers/fixture";
import { accountIds } from "../../lib/demo/fixture";

test("financial JSON import is idempotent and bill payments settle once", async ({
  request,
}) => {
  const input = {
    Entradas: [{ name: "Importação E2E", value: 123.45 }],
    "Gastos fixos": [{ name: "Moradia E2E", value: 10 }],
    "Gastos variáveis": [{ name: "Lazer E2E", value: 5 }],
    context: {
      accountName: "Importação",
      competenceMonth: "2026-07",
      transactionDate: "2026-07-16",
    },
  };
  const created = await request.post("/api/import/financial-json", {
    data: input,
  });
  expect(created.status()).toBe(200);
  const before = (await (await request.get("/api/transactions")).json())
    .transactions.length;
  expect(
    (await request.post("/api/import/financial-json", { data: input })).ok(),
  ).toBe(true);
  expect(
    (await (await request.get("/api/transactions")).json()).transactions,
  ).toHaveLength(before);
  const bill = await request.post("/api/credit-card/bills", {
    data: {
      accountId: accountIds.credit,
      invoiceMonth: "2026-07",
      dueDate: "2026-07-18",
      statementTotalCents: 10000,
      currentChargesTotalCents: 10000,
    },
  });
  expect(bill.status()).toBe(201);
  const payment = {
    accountId: accountIds.credit,
    paymentAccountId: accountIds.checking,
    amountCents: 10000,
    paymentDate: "2026-07-16",
    idempotencyKey: "bill-payment-e2e",
  };
  expect(
    (
      await request.post("/api/credit-card/bills/2026-07/payments", {
        data: payment,
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await request.post("/api/credit-card/bills/2026-07/payments", {
        data: payment,
      })
    ).status(),
  ).toBe(200);
});

test("MCP exposes tools over the real HTTP transport", async ({ request }) => {
  const response = await request.post("/api/mcp", {
    headers: { Accept: "application/json, text/event-stream" },
    data: { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
  });
  expect(response.status()).toBe(200);
  expect((await response.json()).result.tools).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "list_finance_references" }),
    ]),
  );
});
