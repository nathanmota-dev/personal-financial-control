import { describe, expect, it } from "vitest";

import type { PluggyCardRow } from "@/lib/interfaces/pluggy-card-import";
import { rebuildInstallmentTotal } from "@/lib/server/pluggy/card-installment-total";
import { assignInvoiceMonths, endsBeforeCutoff, groupCardPurchases, installmentFingerprint, singlePaymentFingerprint } from "@/lib/server/pluggy/group-card-installments";

const ACCOUNT = "account-1";
const CLOSING_DAY = 5;
const options = { accountId: ACCOUNT, closingDay: CLOSING_DAY };

let nextId = 0;
const row = (overrides: Partial<PluggyCardRow> = {}): PluggyCardRow => ({
  remoteId: `r${++nextId}`, kind: "purchase", status: "posted", amountCents: 1000, date: "2026-03-20", purchaseDate: null,
  description: "Loja", installmentNumber: null, totalInstallments: null, billId: null, ...overrides,
});
const installment = (number: number, total: number, overrides: Partial<PluggyCardRow> = {}) => row({ installmentNumber: number, totalInstallments: total, ...overrides });
const months = new Map([["b4", "2026-04"], ["b5", "2026-05"], ["b6", "2026-06"], ["b1", "2027-01"], ["b2", "2027-02"]]);
const group = (rows: PluggyCardRow[], bills: ReadonlyMap<string, string> = months) => groupCardPurchases(assignInvoiceMonths(rows, bills, CLOSING_DAY), options);

describe("installments as the bank states them", () => {
  it("keeps one purchase when the first installment holds the whole remainder", () => {
    const purchases = group([
      installment(1, 6, { amountCents: 16639, billId: "b4", purchaseDate: "2026-03-20", description: "LOJA I01/06" }),
      ...[2, 3, 4, 5, 6].map((number) => installment(number, 6, { amountCents: 16634, purchaseDate: "2026-03-20", description: `LOJA I0${number}/06`, status: "pending" })),
    ]);
    expect(purchases).toHaveLength(1);
    expect(purchases[0]).toMatchObject({ totalCents: 99809, residualCents: 0, installmentCount: 6 });
    expect(purchases[0].installmentPlan?.map((item) => item.amountCents)).toEqual([16639, 16634, 16634, 16634, 16634, 16634]);
    expect(purchases[0].installmentPlan?.map((item) => item.invoiceMonth)).toEqual(["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"]);
    expect(purchases[0].alternateFingerprints).toHaveLength(5);
  });

  it("keeps an anticipated installment in the invoice that billed it", () => {
    const [purchase, ...others] = group([
      installment(2, 2, { amountCents: 8694, billId: "b6", purchaseDate: "2026-05-07", date: "2026-05-20", description: "LOJA02/02" }),
      installment(1, 2, { amountCents: 8694, billId: "b6", purchaseDate: "2026-05-07", description: "LOJA01/02" }),
    ]);
    expect(others).toHaveLength(0);
    expect(purchase).toMatchObject({ firstInvoiceMonth: "2026-06", description: "LOJA" });
    expect(purchase.installmentPlan).toEqual([{ amountCents: 8694, invoiceMonth: "2026-06" }, { amountCents: 8694, invoiceMonth: "2026-06" }]);
  });

  it("splits what the bank has not delivered yet over the remaining months", () => {
    const [purchase] = group([installment(1, 3, { amountCents: 3334, billId: "b4", purchaseDate: "2026-03-20" })]);
    expect(purchase.installmentPlan?.reduce((sum, item) => sum + item.amountCents, 0)).toBe(purchase.totalCents);
    expect(purchase.installmentPlan?.map((item) => item.invoiceMonth)).toEqual(["2026-04", "2026-05", "2026-06"]);
  });
});

describe("grouping card installments", () => {
  it("joins every installment of a purchase into one charge (pattern A)", () => {
    const [purchase, ...others] = group([
      installment(1, 3, { amountCents: 3334, billId: "b4", purchaseDate: "2026-03-20", description: "LOJA PARC 01/03" }),
      installment(2, 3, { amountCents: 3333, billId: "b5", purchaseDate: "2026-03-20", description: "LOJA PARC 02/03" }),
      installment(3, 3, { amountCents: 3333, billId: "b6", purchaseDate: "2026-03-20", description: "LOJA PARC 03/03" }),
    ]);
    expect(others).toHaveLength(0);
    expect(purchase).toMatchObject({ totalCents: 10000, residualCents: 0, installmentCount: 3, firstInvoiceMonth: "2026-04", purchaseDate: "2026-03-20", description: "LOJA", status: "posted", dateIsApproximate: false });
  });

  it("rebuilds a purchase first seen at a later installment (pattern B)", () => {
    expect(group([installment(3, 5, { amountCents: 2000, billId: "b6" })])).toMatchObject([{ firstInvoiceMonth: "2026-04", totalCents: 10000, installmentCount: 5 }]);
  });

  it("keeps one purchase when different deliveries bring different installments", () => {
    const earlier = group([installment(1, 2, { amountCents: 5000, billId: "b4" })])[0];
    const later = group([installment(1, 2, { amountCents: 5000, billId: "b4" }), installment(2, 2, { amountCents: 5000, billId: "b5" })])[0];
    expect(later.fingerprint).toBe(earlier.fingerprint);
  });

  it("keeps identical purchases of the same month apart", () => {
    const purchases = group([1, 2].flatMap((number) => [installment(number, 2, { billId: number === 1 ? "b4" : "b5" }), installment(number, 2, { billId: number === 1 ? "b4" : "b5" })]));
    expect(purchases).toHaveLength(2);
    expect(new Set(purchases.map((purchase) => purchase.fingerprint)).size).toBe(2);
    expect(purchases.map((purchase) => purchase.totalCents)).toEqual([2000, 2000]);
  });

  it("separates purchases by description, count, first invoice and amount", () => {
    const purchases = group([
      installment(1, 2, { billId: "b4" }),
      installment(1, 2, { billId: "b4", description: "Outra loja" }),
      installment(1, 3, { billId: "b4" }),
      installment(1, 2, { billId: "b5" }),
      installment(1, 2, { billId: "b4", amountCents: 1500 }),
    ]);
    expect(purchases).toHaveLength(5);
  });

  it("treats a record with missing or impossible metadata as a single payment", () => {
    const purchases = group([row({ installmentNumber: 2 }), row({ totalInstallments: 3 }), row({ billId: "unknown-bill" })]);
    expect(purchases).toHaveLength(3);
    expect(purchases.every((purchase) => purchase.installmentCount === 1 && purchase.residualCents === 0)).toBe(true);
  });

  it("keeps a purchase together when the closing day misses the billed month", () => {
    const purchaseDate = "2026-03-05";
    const purchases = group([
      installment(1, 2, { billId: "b5", purchaseDate }),
      installment(2, 2, { status: "pending", date: "2026-04-05", purchaseDate }),
    ]);
    expect(purchases).toMatchObject([{ firstInvoiceMonth: "2026-05", installmentCount: 2, totalCents: 2000 }]);
  });

  it("is pending only while no installment has been posted", () => {
    expect(group([installment(1, 2, { status: "pending" }), installment(2, 2, { status: "pending", date: "2026-04-20" })])[0].status).toBe("pending");
    expect(group([installment(1, 2, { billId: "b4" }), installment(2, 2, { status: "pending", date: "2026-04-20" })])[0].status).toBe("posted");
  });

  it("uses the purchase date of installment 1, and marks the closing date as approximate otherwise", () => {
    expect(group([installment(1, 2, { billId: "b4", date: "2026-03-15" })])[0]).toMatchObject({ purchaseDate: "2026-03-15", dateIsApproximate: false });
    expect(group([installment(2, 2, { billId: "b5" })])[0]).toMatchObject({ purchaseDate: "2026-04-05", dateIsApproximate: true });
  });

  it("keeps a description that is only an installment marker", () => {
    expect(group([installment(1, 2, { description: "1/2", billId: "b4" })])[0].description).toBe("1/2");
  });

  it("signs refunds and keeps them out of installment groups", () => {
    expect(group([row({ kind: "refund", amountCents: 500, installmentNumber: 1, totalInstallments: 2 })])).toMatchObject([{ kind: "adjustment", totalCents: -500, installmentCount: 1 }]);
  });
});

describe("rebuilding installment totals", () => {
  const seen = (entries: [number, number][]) => entries.map(([installmentNumber, amountCents]) => ({ installmentNumber, amountCents }));

  it("sums the installments when all of them are present", () => {
    expect(rebuildInstallmentTotal(seen([[1, 3334], [2, 3333], [3, 3333]]), 3)).toEqual({ totalCents: 10000, residualCents: 0 });
  });

  it("recovers the exact total from the installments carrying an extra cent", () => {
    expect(rebuildInstallmentTotal(seen([[1, 3334], [2, 3333]]), 3)).toEqual({ totalCents: 10000, residualCents: 0 });
    expect(rebuildInstallmentTotal(seen([[1, 2501], [2, 2501], [3, 2500]]), 5)).toEqual({ totalCents: 12502, residualCents: 0 });
  });

  it("reports what the observed cents cannot prove", () => {
    expect(rebuildInstallmentTotal(seen([[1, 3334], [3, 3333]]), 3)).toEqual({ totalCents: 10000, residualCents: 1 });
    expect(rebuildInstallmentTotal(seen([[3, 3333]]), 3)).toEqual({ totalCents: 9999, residualCents: 2 });
    expect(rebuildInstallmentTotal(seen([[1, 3334]]), 3)).toEqual({ totalCents: 10002, residualCents: 2 });
  });

  it("proves an even split when both ends match", () => {
    expect(rebuildInstallmentTotal(seen([[1, 2000], [3, 2000]]), 3)).toEqual({ totalCents: 6000, residualCents: 0 });
  });

  it("never reports more than one cent per other installment", () => {
    expect(rebuildInstallmentTotal(seen([[2, 1000]]), 12).residualCents).toBeLessThanOrEqual(11);
  });

  it("reports a pattern that does not follow the rounding rule", () => {
    expect(rebuildInstallmentTotal(seen([[1, 1000], [3, 1001]]), 4)).toEqual({ totalCents: 4003, residualCents: 3 });
  });
});

describe("first invoice month", () => {
  it("crosses a year boundary when walking back from a billed installment", () => {
    expect(group([installment(3, 4, { billId: "b1" })])[0].firstInvoiceMonth).toBe("2026-11");
    expect(group([installment(4, 4, { billId: "b2" })])[0].firstInvoiceMonth).toBe("2026-11");
  });

  it("uses the closing day when there is no bill", () => {
    expect(group([row({ date: "2026-03-05" })])[0].firstInvoiceMonth).toBe("2026-03");
    expect(group([row({ date: "2026-03-06" })])[0].firstInvoiceMonth).toBe("2026-04");
    expect(group([row({ date: "2026-12-06" })])[0].firstInvoiceMonth).toBe("2027-01");
  });

  it("estimates from the stated purchase date when a later installment has no bill", () => {
    expect(group([installment(2, 3, { status: "pending", purchaseDate: "2026-12-20", date: "2027-01-20" })], new Map())[0].firstInvoiceMonth).toBe("2027-01");
  });

  it("walks back from the record date when no purchase date is stated", () => {
    expect(group([installment(2, 3, { status: "pending", date: "2026-03-20" })], new Map())[0].firstInvoiceMonth).toBe("2026-03");
  });

  it("clamps the approximate date to the last day of a short month", () => {
    const purchases = groupCardPurchases(assignInvoiceMonths([installment(2, 2, { billId: "b5" })], new Map([["b5", "2026-03"]]), 31), { accountId: ACCOUNT, closingDay: 31 });
    expect(purchases[0]).toMatchObject({ firstInvoiceMonth: "2026-02", purchaseDate: "2026-02-28" });
  });

  it("finds purchases that end before the cutoff", () => {
    expect(endsBeforeCutoff({ firstInvoiceMonth: "2025-10", installmentCount: 2 }, "2026-01-15")).toBe(true);
    expect(endsBeforeCutoff({ firstInvoiceMonth: "2025-10", installmentCount: 4 }, "2026-01-15")).toBe(false);
  });
});

describe("card fingerprints", () => {
  const key = { normalized: "LOJA", count: 3, firstInvoiceMonth: "2026-04" };

  it("is stable across runs and differs per input", () => {
    expect(installmentFingerprint(ACCOUNT, key, 1000, 0)).toBe(installmentFingerprint(ACCOUNT, key, 1000, 0));
    expect(new Set([
      installmentFingerprint(ACCOUNT, key, 1000, 0),
      installmentFingerprint("account-2", key, 1000, 0),
      installmentFingerprint(ACCOUNT, { ...key, normalized: "OUTRA" }, 1000, 0),
      installmentFingerprint(ACCOUNT, key, 1001, 0),
      installmentFingerprint(ACCOUNT, { ...key, count: 4 }, 1000, 0),
      installmentFingerprint(ACCOUNT, { ...key, firstInvoiceMonth: "2026-05" }, 1000, 0),
      installmentFingerprint(ACCOUNT, key, 1000, 1),
    ]).size).toBe(7);
  });

  it("does not depend on the text around the description", () => {
    const fingerprintOf = (description: string) => group([installment(1, 2, { description, billId: "b4" })])[0].fingerprint;
    expect(fingerprintOf("LOJA PARC 01/02")).toBe(fingerprintOf("Loja 1/2"));
  });

  it("fits the limit of the charge schema", () => {
    expect(installmentFingerprint(ACCOUNT, key, 1000, 0).length).toBeLessThanOrEqual(255);
    expect(singlePaymentFingerprint("x".repeat(400)).length).toBeLessThanOrEqual(255);
    expect(singlePaymentFingerprint("remote-1")).toBe("pluggy:card:remote-1");
  });
});
