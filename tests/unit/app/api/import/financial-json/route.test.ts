import { expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import * as route from "@/app/api/import/financial-json/route";
import { getFinanceDatabase } from "@/lib/db";

routeDatabase();
guardCases(route);
it("imports every financial section and skips exactly matching persisted rows", async () => {
  const input = {
    Entradas: [{ name: "Salário importado", value: 123.45 }],
    "Gastos fixos": [{ name: "Aluguel importado", value: 20 }],
    "Gastos variáveis": [{ name: "Lazer importado", value: 10 }],
    Investimentos: [{ name: "Aporte importado", value: 5 }],
    context: {
      accountName: "Importada",
      competenceMonth: "2026-07",
      transactionDate: "2026-07-16",
    },
  };
  const first = await route.POST(request("POST", input));
  expect(first.status).toBe(200);
  const body = await first.json();
  expect(body.summary).toEqual({
    categoriesCreated: 4,
    categoriesReused: 0,
    transactionsCreated: 4,
    transactionsSkipped: 0,
  });
  expect(body.createdTransactions[0].amountCents).toBe(12345);
  const second = await (await route.POST(request("POST", input))).json();
  expect(second.account.id).toBe(body.account.id);
  expect(second.summary).toEqual({
    categoriesCreated: 0,
    categoriesReused: 4,
    transactionsCreated: 0,
    transactionsSkipped: 4,
  });
  expect(
    second.skippedTransactions.every(
      (row: { reason: string }) => row.reason === "duplicate_exact_match",
    ),
  ).toBe(true);
  input.Entradas[0].value = 125;
  expect(
    (await (await route.POST(request("POST", input))).json()).summary
      .transactionsCreated,
  ).toBe(1);
});
it("uses the default account and context for empty sections", async () => {
  const body = await (await route.POST(request("POST", {}))).json();
  expect(body.account.name).toBe("Conta principal");
  expect(body.context.competenceMonth).toBe("2026-05");
  expect(body.summary.transactionsCreated).toBe(0);
});
it.each([
  { Entradas: [{ name: "", value: 2 }] },
  { Entradas: [{ name: "Inválido", value: -1 }] },
  null,
])("rejects invalid import payload %j", async (input) => {
  expect((await route.POST(request("POST", input))).status).toBe(400);
});
it("reports database failures without returning a success summary", async () => {
  vi.mocked(getFinanceDatabase).mockRejectedValueOnce(
    new Error("Banco indisponível"),
  );
  const response = await route.POST(request("POST", {}));
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    ok: false,
    error: "Banco indisponível",
  });
});
