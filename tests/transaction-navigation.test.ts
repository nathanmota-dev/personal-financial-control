import { describe, expect, it } from "vitest";

import type {
  TransactionMutationPayload,
  TransactionRow,
} from "@/lib/interfaces/transactions";
import { transactionSaveDestination } from "@/lib/transaction-navigation";

const payload: TransactionMutationPayload = {
  accountId: "00000000-0000-4000-8000-000000000001",
  categoryId: "00000000-0000-4000-8000-000000000002",
  type: "expense",
  status: "posted",
  amountCents: 28500,
  transactionDate: "2026-07-30",
  competenceMonth: "2026-09",
  description: "Oculos",
  notes: "",
  fundingSource: "investments",
};
const transaction: TransactionRow = {
  ...payload,
  id: "00000000-0000-4000-8000-000000000003",
  categoryId: null,
  recurringTemplateId: null,
  fundingSource: "investments",
  fundingLink: null,
  isGeneratedByFunding: false,
  account: null,
  category: null,
};

describe("transaction navigation after saving", () => {
  it("returns to the standard monthly list after the last uncategorized item is categorized", () => {
    expect(
      transactionSaveDestination({
        transaction,
        payload,
        afterCategorization: "/transactions?month=2026-09",
      })
    ).toBe("/transactions?month=2026-09");
  });

  it("stays on the filtered list when the transaction remains uncategorized", () => {
    expect(
      transactionSaveDestination({
        transaction,
        payload: { ...payload, categoryId: null },
        afterCategorization: "/transactions?month=2026-09",
      })
    ).toBeNull();
  });

  it("does not redirect while other uncategorized transactions remain", () => {
    expect(
      transactionSaveDestination({ transaction, payload })
    ).toBeNull();
  });
});
