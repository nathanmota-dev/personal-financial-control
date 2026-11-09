import { expect, it } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import { pluggyGuardCases } from "../helpers";
import * as route from "@/app/api/pluggy/category-rules/route";
import { getFinanceDatabase } from "@/lib/db";
import { createCategory } from "@/lib/server/categories";
import { createTransaction } from "@/lib/server/transactions";

const state = routeDatabase();
guardCases(route);
pluggyGuardCases(route);

const post = (body: unknown) => route.POST(request("POST", body));

async function pendingExpense() {
  const db = await getFinanceDatabase();
  await createTransaction({ accountId: state.checkingId, type: "expense", status: "posted", amountCents: 1250, transactionDate: "2026-03-10", competenceMonth: "2026-03", description: "Mercado Bom", importFingerprint: "pluggy:bank:1" }, db);
  return db;
}

it("lists pending descriptions", async () => {
  await pendingExpense();
  const response = await route.GET(request());
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ ok: true, pending: [{ normalizedDescription: "MERCADO BOM", direction: "expense", occurrences: 1, totalCents: 1250 }] });
});

it("applies a category and returns what is left", async () => {
  const db = await pendingExpense();
  const category = await createCategory({ name: "Mercado teste", group: "variable_expense" }, db);
  const response = await post({ normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: category.id });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ ok: true, applied: 1, pending: [] });
});

it.each([
  [{ normalizedDescription: "", direction: "expense", categoryId: "x" }],
  [{ normalizedDescription: "X", direction: "transfer", categoryId: "x" }],
  [{ normalizedDescription: "X", direction: "expense" }],
])("rejects invalid input %#", async (body) => {
  expect((await post(body)).status).toBe(400);
});

it("rejects a category that does not fit", async () => {
  const response = await post({ normalizedDescription: "X", direction: "expense", categoryId: "missing" });
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "PLUGGY_CATEGORY_RULE_INVALID" } });
});
