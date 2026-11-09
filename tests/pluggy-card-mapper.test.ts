import { describe, expect, it } from "vitest";

import type { PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import { mapCardTransaction } from "@/lib/server/pluggy/mappers/card-transaction";
import { pluggyTransactionSchema } from "@/lib/server/pluggy/schemas";

const remote = (overrides: Partial<PluggyRemoteTransaction> = {}): PluggyRemoteTransaction => ({ id: "t1", date: "2026-03-10T15:00:00.000Z", amount: 12.34, type: "DEBIT", status: "POSTED", description: " Loja ", ...overrides });

describe("card transaction mapper", () => {
  it("reads a positive amount as a purchase", () => {
    expect(mapCardTransaction(remote())).toMatchObject({ remoteId: "t1", kind: "purchase", status: "posted", amountCents: 1234, date: "2026-03-10", description: "Loja" });
  });

  it("separates refunds from bill payments among negative amounts", () => {
    expect(mapCardTransaction(remote({ amount: -5, description: "ESTORNO LOJA", operationType: "OUTROS" }))?.kind).toBe("refund");
    expect(mapCardTransaction(remote({ amount: -5, description: "Crédito", operationType: "PAGAMENTO_FATURA" }))?.kind).toBe("bill_payment");
    expect(mapCardTransaction(remote({ amount: -5, description: "PAGAMENTO EFETUADO", operationType: "OUTROS" }))?.kind).toBe("bill_payment");
    expect(mapCardTransaction(remote({ amount: -5, description: null }))?.kind).toBe("refund");
  });

  it("uses the account currency amount for foreign purchases", () => {
    expect(mapCardTransaction(remote({ amount: 10, currencyCode: "USD", amountInAccountCurrency: 55.5 }))).toMatchObject({ kind: "purchase", amountCents: 5550 });
    expect(mapCardTransaction(remote({ amount: -10, currencyCode: "USD", amountInAccountCurrency: -55.5 }))).toMatchObject({ kind: "refund", amountCents: 5550 });
    expect(mapCardTransaction(remote({ amount: 10, currencyCode: "BRL" }))?.amountCents).toBe(1000);
  });

  it("flags a foreign purchase without an account currency amount", () => {
    expect(mapCardTransaction(remote({ amount: 10, currencyCode: "USD" }))).toMatchObject({ kind: "unconverted", amountCents: 1000 });
  });

  it("keeps a date-only purchase date and converts a timed one", () => {
    const purchaseDateOf = (purchaseDate: string) => mapCardTransaction(remote({ creditCardMetadata: { purchaseDate } }))?.purchaseDate;
    expect(purchaseDateOf("2026-03-10T00:00:00.000Z")).toBe("2026-03-10");
    expect(purchaseDateOf("2026-03-10")).toBe("2026-03-10");
    expect(purchaseDateOf("2026-03-11T02:59:59.999Z")).toBe("2026-03-10");
  });

  it("reads installments and ignores impossible ones", () => {
    const installments = (installmentNumber: number, totalInstallments: number) => mapCardTransaction(remote({ creditCardMetadata: { installmentNumber, totalInstallments, billId: "b1" } }));
    expect(installments(2, 3)).toMatchObject({ installmentNumber: 2, totalInstallments: 3, billId: "b1" });
    for (const [number, total] of [[1, 1], [4, 3], [0, 3], [1, 61]]) expect(installments(number, total)).toMatchObject({ installmentNumber: null, totalInstallments: null });
  });

  it("prefers the provider id, and marks pending records", () => {
    expect(mapCardTransaction(remote({ providerId: "p1", status: "PENDING" }))).toMatchObject({ remoteId: "p1", status: "pending" });
  });

  it("rejects records that cannot become a charge", () => {
    expect(mapCardTransaction(remote({ amount: 0 }))).toBeNull();
    expect(mapCardTransaction(remote({ date: "invalid" }))).toBeNull();
  });

  it("does not reject a page because of malformed card metadata", () => {
    const parsed = pluggyTransactionSchema.parse(remote({ creditCardMetadata: "broken" as never }));
    expect(parsed.creditCardMetadata).toBeNull();
  });
});
