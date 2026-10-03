import { expect, it } from "vitest";
import {
  guardCases,
  request,
  routeDatabase,
} from "../../../../../../helpers/route";
import * as route from "@/app/api/credit-card/bills/[invoiceMonth]/payments/route";
import {
  getCreditCardBill,
  upsertCreditCardBill,
} from "@/lib/server/credit-card-bills";
import { listTransactions } from "@/lib/server/transactions";

const database = routeDatabase();
guardCases(route);
it("settles an invoice once and preserves payment idempotency", async () => {
  await upsertCreditCardBill({
    accountId: database.creditId,
    invoiceMonth: "2026-07",
    dueDate: "2026-07-12",
    statementTotalCents: 10000,
    currentChargesTotalCents: 10000,
  });
  const input = {
    accountId: database.creditId,
    paymentAccountId: database.checkingId,
    amountCents: 10000,
    paymentDate: "2026-07-16",
    idempotencyKey: "payment-once",
  };
  const context = { params: Promise.resolve({ invoiceMonth: "2026-07" }) };
  const created = await route.POST(request("POST", input), context);
  expect(created.status).toBe(201);
  expect((await created.json()).payment).toMatchObject({
    idempotent: false,
    amountCents: 10000,
    bill: { status: "paid" },
  });
  const repeated = await route.POST(request("POST", input), context);
  expect(repeated.status).toBe(200);
  expect((await repeated.json()).payment.idempotent).toBe(true);
  expect(await listTransactions()).toHaveLength(1);
  expect(await getCreditCardBill(database.creditId, "2026-07")).toMatchObject({
    status: "paid",
    paidAt: "2026-07-16",
  });
  expect((await route.POST(request("POST", {}), context)).status).toBe(400);
  expect(
    (
      await route.POST(
        request("POST", { ...input, idempotencyKey: "second" }),
        context,
      )
    ).status,
  ).toBe(400);
});
