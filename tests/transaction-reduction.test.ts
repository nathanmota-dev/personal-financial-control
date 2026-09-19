import { describe, expect, it } from "vitest";

import type {
  TransactionMutationPayload,
  TransactionRow,
} from "@/lib/interfaces/transactions";
import { needsInvestmentReductionConfirmation } from "@/lib/transaction-reduction";

const today = "2026-09-19";
const payload: TransactionMutationPayload = {
  accountId: "00000000-0000-4000-8000-000000000001",
  categoryId: null,
  type: "expense",
  status: "posted",
  amountCents: 28500,
  transactionDate: "2026-07-30",
  competenceMonth: "2026-09",
  description: "Oculos",
  notes: "",
  fundingSource: "investments",
};
const existing: TransactionRow = {
  ...payload,
  id: "00000000-0000-4000-8000-000000000002",
  recurringTemplateId: null,
  fundingSource: "investments",
  fundingLink: {
    id: "00000000-0000-4000-8000-000000000003",
    expenseTransactionId: "00000000-0000-4000-8000-000000000002",
    withdrawalTransactionId: "00000000-0000-4000-8000-000000000004",
    type: "investment_funded_expense",
  },
  isGeneratedByFunding: false,
  account: null,
  category: null,
};

describe("investment reduction confirmation", () => {
  it("does not request another distribution when only categorizing a linked expense", () => {
    expect(
      needsInvestmentReductionConfirmation(
        { ...payload, categoryId: "00000000-0000-4000-8000-000000000005" },
        existing,
        today
      )
    ).toBe(false);
  });

  it("requests a new distribution when the reduction amount changes", () => {
    expect(
      needsInvestmentReductionConfirmation({ ...payload, amountCents: 30000 }, existing, today)
    ).toBe(true);
  });

  it("requests a distribution for a new investment-funded expense", () => {
    expect(needsInvestmentReductionConfirmation(payload, undefined, today)).toBe(true);
  });
});
