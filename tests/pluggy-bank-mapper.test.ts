import { describe, expect, it } from "vitest";

import type { PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import { mapBankTransaction, toAmountCents } from "@/lib/server/pluggy/mappers/bank-transaction";

const remote = (overrides: Partial<PluggyRemoteTransaction> = {}): PluggyRemoteTransaction => ({ id: "tx-1", date: "2026-03-10T15:00:00.000Z", amount: -12.34, type: "DEBIT", status: "POSTED", description: " Mercado ", ...overrides });

describe("mapBankTransaction", () => {
  it("rounds to integer cents without binary noise", () => {
    expect(toAmountCents(19.99)).toBe(1999);
    expect(toAmountCents(-0.07)).toBe(7);
    expect(toAmountCents(1.005)).toBe(101);
    expect(mapBankTransaction(remote())).toMatchObject({ amountCents: 1234, description: "Mercado" });
  });

  it("takes the direction from type and ignores the sign", () => {
    expect(mapBankTransaction(remote({ type: "DEBIT", amount: 50 }))).toMatchObject({ direction: "DEBIT", type: "expense", amountCents: 5000 });
    expect(mapBankTransaction(remote({ type: "CREDIT", amount: -50 }))).toMatchObject({ direction: "CREDIT", type: "income", amountCents: 5000 });
  });

  it("reads the day in São Paulo, across day and month boundaries", () => {
    expect(mapBankTransaction(remote({ date: "2026-03-11T02:59:59.999Z" }))).toMatchObject({ transactionDate: "2026-03-10", competenceMonth: "2026-03" });
    expect(mapBankTransaction(remote({ date: "2026-03-11T03:00:00.000Z" }))).toMatchObject({ transactionDate: "2026-03-11" });
    expect(mapBankTransaction(remote({ date: "2026-04-01T02:00:00.000Z" }))).toMatchObject({ transactionDate: "2026-03-31", competenceMonth: "2026-03" });
  });

  it("maps the status", () => {
    expect(mapBankTransaction(remote({ status: "PENDING" }))?.status).toBe("pending");
    expect(mapBankTransaction(remote({ status: "POSTED" }))?.status).toBe("posted");
    expect(mapBankTransaction(remote({ status: undefined }))?.status).toBe("posted");
  });

  it("prefers providerId for the fingerprint", () => {
    expect(mapBankTransaction(remote({ providerId: "provider-9" }))?.fingerprint).toBe("pluggy:bank:provider-9");
    expect(mapBankTransaction(remote())?.fingerprint).toBe("pluggy:bank:tx-1");
  });

  it("falls back on an empty description and keeps the classifier fields", () => {
    const paymentData = { payer: { name: "Fulano" } };
    expect(mapBankTransaction(remote({ description: "  ", operationType: "PIX", paymentData }))).toMatchObject({ description: "Lançamento bancário", operationType: "PIX", paymentData });
    expect(mapBankTransaction(remote())).toMatchObject({ operationType: null, paymentData: null });
  });

  it.each([{ type: "OTHER" }, { type: undefined }, { amount: 0 }, { date: "not-a-date" }])("rejects a record that cannot be imported: %j", (overrides) => {
    expect(mapBankTransaction(remote(overrides))).toBeNull();
  });
});
