import { createClient } from "@libsql/client";
import { beforeEach, describe, expect, it } from "vitest";

import {
  decryptMoney,
  encryptMoney,
  isEncryptedMoneyPayload,
  parseEncryptionKey,
} from "@/lib/crypto/money";
import { createTestDatabase } from "@/tests/helpers/database";
import {
  accounts,
  categories,
  creditCardCharges,
  creditCardInstallments,
  financialGoalAllocations,
  financialGoals,
  investmentPortfolio,
  recurringTemplates,
  transactions,
  transfers,
} from "@/lib/db/schema";

const testKey = Buffer.alloc(32, 7);

beforeEach(() => {
  process.env.DATA_ENCRYPTION_KEY = testKey.toString("base64");
});

describe("money encryption", () => {
  it("round-trips positive, zero, and negative cents", () => {
    for (const value of [123456, 0, -987]) {
      const payload = encryptMoney(value, "tests.money", testKey);

      expect(isEncryptedMoneyPayload(payload)).toBe(true);
      expect(decryptMoney(payload, "tests.money", testKey)).toBe(value);
    }
  });

  it("uses a random nonce for equal values", () => {
    const first = encryptMoney(3000000, "tests.money", testKey);
    const second = encryptMoney(3000000, "tests.money", testKey);

    expect(first).not.toBe(second);
    expect(first.startsWith("pfc:v1:")).toBe(true);
    expect(second.startsWith("pfc:v1:")).toBe(true);
  });

  it("rejects wrong keys, contexts, tampering, and malformed payloads", () => {
    const payload = encryptMoney(30000, "tests.money", testKey);
    const wrongKey = Buffer.alloc(32, 8);
    const parts = payload.split(":");
    parts[3] = `${parts[3].slice(0, -1)}${parts[3].endsWith("A") ? "B" : "A"}`;

    expect(() => decryptMoney(payload, "tests.money", wrongKey)).toThrow();
    expect(() => decryptMoney(payload, "tests.other", testKey)).toThrow();
    expect(() => decryptMoney(parts.join(":"), "tests.money", testKey)).toThrow();
    expect(() => decryptMoney("pfc:v2:invalid", "tests.money", testKey)).toThrow();
  });

  it("validates the configured key length", () => {
    expect(parseEncryptionKey(testKey.toString("base64"))).toEqual(testKey);
    expect(() => parseEncryptionKey(Buffer.alloc(31).toString("base64"))).toThrow();
  });
});

describe("encrypted money columns", () => {
  it("stores every monetary column as authenticated text and returns numbers", async () => {
    const testDatabase = await createTestDatabase();
    const { db, databaseUrl } = testDatabase;

    try {
      const [account] = await db
        .insert(accounts)
        .values({
          name: "Encrypted checking",
          type: "checking",
          initialBalanceCents: 3000000,
        })
        .returning();
      const [creditAccount] = await db
        .insert(accounts)
        .values({
          name: "Encrypted card",
          type: "credit",
          initialBalanceCents: 0,
          creditClosingDay: 15,
        })
        .returning();
      const [category] = await db
        .insert(categories)
        .values({ name: "Encrypted category", group: "variable_expense" })
        .returning();
      const [recurring] = await db
        .insert(recurringTemplates)
        .values({
          accountId: account.id,
          categoryId: category.id,
          type: "expense",
          amountCents: 12000,
          dayOfMonth: 10,
          startMonth: "2026-01",
          description: "Encrypted recurring",
        })
        .returning();
      const [transaction] = await db
        .insert(transactions)
        .values({
          accountId: account.id,
          categoryId: category.id,
          recurringTemplateId: recurring.id,
          type: "expense",
          amountCents: 4500,
          transactionDate: "2026-01-10",
          competenceMonth: "2026-01",
          description: "Encrypted transaction",
        })
        .returning();
      const [transfer] = await db
        .insert(transfers)
        .values({
          fromAccountId: account.id,
          toAccountId: creditAccount.id,
          amountCents: 9900,
          transferDate: "2026-01-10",
          competenceMonth: "2026-01",
          description: "Encrypted transfer",
        })
        .returning();
      const [charge] = await db
        .insert(creditCardCharges)
        .values({
          accountId: creditAccount.id,
          categoryId: category.id,
          description: "Encrypted charge",
          purchaseDate: "2026-01-10",
          totalAmountCents: 10000,
          installmentCount: 2,
          firstInvoiceMonth: "2026-02",
        })
        .returning();
      const [installment] = await db
        .insert(creditCardInstallments)
        .values({
          chargeId: charge.id,
          installmentNumber: 1,
          amountCents: 5000,
          invoiceMonth: "2026-02",
        })
        .returning();
      const [portfolio] = await db
        .insert(investmentPortfolio)
        .values({
          checkpointBalanceCents: 3000000,
          expectedMonthlyRateBps: 100,
          checkpointDate: "2026-01-01",
        })
        .returning();
      const [goal] = await db
        .insert(financialGoals)
        .values({
          name: "Encrypted goal",
          category: "travel",
          targetAmountCents: 500000,
          plannedMonthlyContributionCents: 25000,
        })
        .returning();
      const [allocation] = await db
        .insert(financialGoalAllocations)
        .values({
          goalId: goal.id,
          transactionId: transaction.id,
          type: "manual_release",
          amountCents: -1000,
          occurredOn: "2026-01-10",
        })
        .returning();

      expect(account.initialBalanceCents).toBe(3000000);
      expect(recurring.amountCents).toBe(12000);
      expect(transaction.amountCents).toBe(4500);
      expect(transfer.amountCents).toBe(9900);
      expect(charge.totalAmountCents).toBe(10000);
      expect(installment.amountCents).toBe(5000);
      expect(portfolio.checkpointBalanceCents).toBe(3000000);
      expect(goal.targetAmountCents).toBe(500000);
      expect(goal.plannedMonthlyContributionCents).toBe(25000);
      expect(allocation.amountCents).toBe(-1000);

      const rawClient = createClient({ url: databaseUrl });
      try {
        const result = await rawClient.execute(`
          SELECT
            (SELECT typeof(initial_balance_cents) = 'text' AND initial_balance_cents LIKE 'pfc:v1:%' FROM accounts WHERE id = '${account.id}') AS account_ok,
            (SELECT typeof(amount_cents) = 'text' AND amount_cents LIKE 'pfc:v1:%' FROM recurring_templates WHERE id = '${recurring.id}') AS recurring_ok,
            (SELECT typeof(amount_cents) = 'text' AND amount_cents LIKE 'pfc:v1:%' FROM transactions WHERE id = '${transaction.id}') AS transaction_ok,
            (SELECT typeof(amount_cents) = 'text' AND amount_cents LIKE 'pfc:v1:%' FROM transfers WHERE id = '${transfer.id}') AS transfer_ok,
            (SELECT typeof(total_amount_cents) = 'text' AND total_amount_cents LIKE 'pfc:v1:%' FROM credit_card_charges WHERE id = '${charge.id}') AS charge_ok,
            (SELECT typeof(amount_cents) = 'text' AND amount_cents LIKE 'pfc:v1:%' FROM credit_card_installments WHERE id = '${installment.id}') AS installment_ok,
            (SELECT typeof(checkpoint_balance_cents) = 'text' AND checkpoint_balance_cents LIKE 'pfc:v1:%' FROM investment_portfolio WHERE id = '${portfolio.id}') AS portfolio_ok,
            (SELECT typeof(target_amount_cents) = 'text' AND target_amount_cents LIKE 'pfc:v1:%' FROM financial_goals WHERE id = '${goal.id}') AS goal_target_ok,
            (SELECT typeof(planned_monthly_contribution_cents) = 'text' AND planned_monthly_contribution_cents LIKE 'pfc:v1:%' FROM financial_goals WHERE id = '${goal.id}') AS goal_plan_ok,
            (SELECT typeof(amount_cents) = 'text' AND amount_cents LIKE 'pfc:v1:%' FROM financial_goal_allocations WHERE id = '${allocation.id}') AS allocation_ok
        `);

        expect(Object.values(result.rows[0] ?? {})).toEqual(Array(10).fill(1));

        await expect(
          rawClient.execute({
            sql: "INSERT INTO accounts (id, name, type, initial_balance_cents) VALUES (?, ?, ?, ?)",
            args: ["raw-insert", "Raw insert", "checking", 123],
          })
        ).rejects.toThrow();
      } finally {
        rawClient.close();
      }
    } finally {
      await testDatabase.cleanup();
    }
  });
});
