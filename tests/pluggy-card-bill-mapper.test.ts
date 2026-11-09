import { describe, expect, it } from "vitest";

import type { PluggyRemoteBill } from "@/lib/interfaces/pluggy";
import type { PluggyCardBillTarget } from "@/lib/interfaces/pluggy-card-bills";
import { reconcileCardBill } from "@/lib/server/pluggy/card-bill-reconciliation";
import { mapCardBills } from "@/lib/server/pluggy/mappers/card-bill";
import { billPaymentKind, matchBillPayment } from "@/lib/server/pluggy/match-bill-payment";

const remote = (month: string, totalAmount: number | null, overrides: Partial<PluggyRemoteBill> = {}): PluggyRemoteBill => ({ id: `bill-${month}`, dueDate: `${month}-12T00:00:00.000Z`, billClosingDate: `${month}-05T00:00:00.000Z`, totalAmount, payments: [], ...overrides });
const payment = (paymentDate: string, amount: number) => ({ paymentDate: `${paymentDate}T00:00:00.000Z`, amount });

function target(accountId: string, overrides: Partial<PluggyCardBillTarget> = {}): PluggyCardBillTarget {
  return {
    invoiceMonth: "2026-04", dueDate: "2026-04-12", closingDate: "2026-04-05", statementTotalCents: 10000, priorBalanceCents: 0, priorPaidCents: 0, preStatementPaymentsCents: 0, payments: [],
    link: { id: `link-${accountId}`, itemId: "item", externalAccountId: `remote-${accountId}`, accountId, remoteName: accountId, kind: "credit", cutoffDate: "2026-01-01" },
    billId: `bill-${accountId}`, paid: false, settledCents: 0, importedCents: 10000, differenceCents: 0, ...overrides,
  };
}
const entry = (date: string, amountCents: number) => ({ amountCents, date, claimed: false, mirrored: false });

describe("card bill mapper", () => {
  it("reads the invoice month and dates in UTC", () => {
    const [bill] = mapCardBills([remote("2026-04", 100)]).bills;
    expect(bill).toMatchObject({ invoiceMonth: "2026-04", dueDate: "2026-04-12", closingDate: "2026-04-05", statementTotalCents: 10000 });
  });

  it("orders bills and carries each statement as the next prior balance", () => {
    const { bills } = mapCardBills([remote("2026-05", 200), remote("2026-04", 100), remote("2026-06", 300)]);
    expect(bills.map((bill) => [bill.invoiceMonth, bill.priorBalanceCents])).toEqual([["2026-04", 0], ["2026-05", 10000], ["2026-06", 20000]]);
  });

  it("sums only the payments dated before the statement closes", () => {
    const [bill] = mapCardBills([remote("2026-04", 100, { payments: [payment("2026-04-01", 30), payment("2026-04-04", 10.5), payment("2026-04-05", 20), payment("2026-04-10", 100)] })]).bills;
    expect(bill.preStatementPaymentsCents).toBe(4050);
    expect(bill.payments).toHaveLength(4);
  });

  it("counts as prior paid only what the previous bill received after closing", () => {
    const { bills } = mapCardBills([remote("2026-04", 100, { payments: [payment("2026-04-01", 30), payment("2026-04-10", 60)] }), remote("2026-05", 50)]);
    expect(bills[1]).toMatchObject({ priorBalanceCents: 10000, priorPaidCents: 6000 });
  });

  it("assumes the previous bill was paid when the bank lists no payments", () => {
    expect(mapCardBills([remote("2026-04", 100), remote("2026-05", 50)]).bills[1]).toMatchObject({ priorPaidCents: 10000 });
  });

  it("skips non-positive totals and restarts the prior balance after them", () => {
    const { bills, skipped } = mapCardBills([remote("2026-04", 100), remote("2026-05", 0), remote("2026-06", -25.5), remote("2026-07", null), remote("2026-08", 80)]);
    expect(skipped).toEqual([{ invoiceMonth: "2026-05", dueDate: "2026-05-12", amountCents: 0 }, { invoiceMonth: "2026-06", dueDate: "2026-06-12", amountCents: 2550 }, { invoiceMonth: "2026-07", dueDate: "2026-07-12", amountCents: null }]);
    expect(bills.map((bill) => [bill.invoiceMonth, bill.priorBalanceCents])).toEqual([["2026-04", 0], ["2026-08", 0]]);
  });

  it("keeps one bill per month and ignores unreadable due dates", () => {
    const { bills } = mapCardBills([remote("2026-04", 100), remote("2026-04", 120, { id: "later", dueDate: "2026-04-20T00:00:00.000Z" }), remote("2026-05", 90, { dueDate: "not-a-date" })]);
    expect(bills).toHaveLength(1);
    expect(bills[0]).toMatchObject({ dueDate: "2026-04-20", statementTotalCents: 12000 });
  });

  it("ignores unreadable and zero payments and tolerates a bill without a closing date", () => {
    const [bill] = mapCardBills([remote("2026-04", 100, { billClosingDate: null, payments: [{ paymentDate: null, amount: 10 }, payment("2026-04-02", 0), payment("2026-04-03", 40)] })]).bills;
    expect(bill).toMatchObject({ closingDate: null, preStatementPaymentsCents: 0 });
    expect(bill.payments.map((item) => item.amountCents)).toEqual([4000]);
  });
});

describe("card bill reconciliation identity", () => {
  it.each([
    { name: "purchases only", statement: 50000, current: 50000, prior: 20000, priorPaid: 20000, pre: 0, difference: 0, ignored: 0 },
    { name: "first bill", statement: 12345, current: 12345, prior: 0, priorPaid: 0, pre: 0, difference: 0, ignored: 0 },
    { name: "IOF already imported as a card record", statement: 10380, current: 10380, prior: 5000, priorPaid: 5000, pre: 0, difference: 0, ignored: 0 },
    { name: "payment before closing", statement: 39592, current: 50599, prior: 16071, priorPaid: 16071, pre: 11007, difference: 0, ignored: 0 },
    { name: "prior balance carried", statement: 13000, current: 10000, prior: 5000, priorPaid: 2000, pre: 0, difference: 0, ignored: 0 },
    { name: "overpaid prior carries nothing", statement: 10000, current: 10000, prior: 5000, priorPaid: 7000, pre: 0, difference: 0, ignored: 0 },
    { name: "fee missing from the imported records", statement: 10500, current: 10000, prior: 0, priorPaid: 0, pre: 0, difference: 500, ignored: 0 },
    { name: "imported records above the statement", statement: 9000, current: 10000, prior: 0, priorPaid: 0, pre: 0, difference: -1000, ignored: 1000 },
    { name: "refunds above purchases", statement: 100, current: -500, prior: 0, priorPaid: 0, pre: 0, difference: 600, ignored: 0 },
  ])("$name", ({ statement, current, prior, priorPaid, pre, difference, ignored }) => {
    expect(reconcileCardBill({ statementTotalCents: statement, currentChargesCents: current, priorBalanceCents: prior, priorPaidCents: priorPaid, preStatementPaymentsCents: pre })).toMatchObject({ differenceCents: difference, ignoredAmountCents: ignored });
  });
});

describe("bill payment matching", () => {
  const paid = { amountCents: 10000, date: "2026-04-10" };

  it("matches the total within the due date window", () => {
    const bill = target("a");
    expect(matchBillPayment(paid, [bill])).toEqual({ outcome: "matched", target: bill, entry: null });
    expect(matchBillPayment({ ...paid, date: "2026-03-28" }, [bill])).toMatchObject({ outcome: "matched" });
  });

  it("rejects a total outside the due date window or with another amount", () => {
    expect(matchBillPayment({ ...paid, date: "2026-03-20" }, [target("a")])).toEqual({ outcome: "none" });
    expect(matchBillPayment({ ...paid, amountCents: 9999 }, [target("a")])).toEqual({ outcome: "none" });
  });

  it("prefers a listed payment over an equal total on another card", () => {
    const listed = target("a", { statementTotalCents: 40000, payments: [entry("2026-04-09", 10000)] });
    expect(matchBillPayment(paid, [target("b"), listed])).toMatchObject({ outcome: "matched", target: { link: { accountId: "a" } } });
  });

  it("does not reuse a claimed entry", () => {
    expect(matchBillPayment(paid, [target("a", { statementTotalCents: 40000, payments: [{ ...entry("2026-04-09", 10000), claimed: true }] })])).toEqual({ outcome: "none" });
  });

  it("reports two cards that fit instead of guessing", () => {
    expect(matchBillPayment(paid, [target("a"), target("b")])).toEqual({ outcome: "ambiguous" });
    expect(matchBillPayment(paid, [target("a", { payments: [entry("2026-04-10", 10000)] }), target("b", { payments: [entry("2026-04-09", 10000)] })])).toEqual({ outcome: "ambiguous" });
  });

  it("picks the closest bill of a single card", () => {
    const april = target("a", { payments: [entry("2026-04-08", 10000)] });
    const may = target("a", { invoiceMonth: "2026-05", payments: [entry("2026-04-11", 10000)] });
    expect(matchBillPayment(paid, [april, may])).toMatchObject({ target: { invoiceMonth: "2026-05" } });
  });

  it("does not settle a paid bill again by its total", () => {
    expect(matchBillPayment(paid, [target("a", { paid: true })])).toEqual({ outcome: "none" });
  });

  it("classifies by the closing date", () => {
    expect(billPaymentKind(target("a"), "2026-04-04")).toBe("pre_statement");
    expect(billPaymentKind(target("a"), "2026-04-05")).toBe("settlement");
    expect(billPaymentKind(target("a", { closingDate: null }), "2026-04-01")).toBe("settlement");
  });
});
