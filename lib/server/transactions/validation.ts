import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
categories,
transactionFundingLinks
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { investmentReductionSelectionSchema } from "@/lib/server/investment-reconciliation";
import { and,eq } from "drizzle-orm";
import { z } from "zod";


export const transactionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().nullable().optional(),
  type: z.enum([
    "income",
    "expense",
    "investment_contribution",
    "investment_withdrawal",
  ]),
  status: z.enum(["pending", "posted", "cancelled"]).default("posted"),
  amountCents: z.number().int().positive(),
  transactionDate: z.string(),
  competenceMonth: z.string(),
  description: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  importFingerprint: z.string().trim().min(1).max(255).optional(),
  recurringTemplateId: z.string().uuid().optional(),
  fundingSource: z.enum(["account", "investments"]).optional(),
  sourceSelections: z.array(investmentReductionSelectionSchema).optional(),
  sources: z.array(investmentReductionSelectionSchema).optional(),
});

export const updateTransactionSchema = transactionSchema.partial().extend({
  id: z.string().uuid(),
});

export type TransactionValues = z.infer<typeof transactionSchema>;

export type TransactionDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export type TransactionLinkRow = typeof transactionFundingLinks.$inferSelect;

export async function resolveDb(database?: TransactionDb) {
  return database ?? getFinanceDatabase();
}

export type TransactionDb = AppDb | TransactionDbTransaction;

export function sourceSelectionsFromInput(input: {
  sourceSelections?: TransactionValues["sourceSelections"];
  sources?: TransactionValues["sources"];
}) {
  return input.sourceSelections ?? input.sources;
}

export function isLiquidAccountType(type: string) {
  return type === "checking" || type === "savings" || type === "cash";
}

export function isInvestmentMovementType(type: TransactionValues["type"]) {
  return type === "investment_contribution" || type === "investment_withdrawal";
}

export function automaticWithdrawalDescription(description: string) {
  return `Resgate automático: ${description}`;
}

export async function findInvestmentFundingCategory(database: TransactionDb) {
  const category = await database.query.categories.findFirst({
    where: and(
      eq(categories.name, "Investimentos"),
      eq(categories.group, "investment"),
      eq(categories.isArchived, false)
    ),
  });

  invariant(
    category,
    "INVESTMENT_FUNDING_CATEGORY_NOT_FOUND",
    'Crie ou reative a categoria de investimento "Investimentos" antes de pagar uma despesa com investimentos.'
  );

  return category;
}

export async function validateTransactionDependencies(
  input: TransactionValues,
  database: TransactionDb
) {
  const categoryId = input.categoryId;
  const [account, category] = await Promise.all([
    database.query.accounts.findFirst({ where: (table, { eq }) => eq(table.id, input.accountId) }),
    categoryId
      ? database.query.categories.findFirst({ where: (table, { eq }) => eq(table.id, categoryId) })
      : Promise.resolve(null),
  ]);

  invariant(account, "ACCOUNT_NOT_FOUND", "Account does not exist.", 404);

  invariant(!account.isArchived, "ACCOUNT_ARCHIVED", "Cannot use an archived account.");
  if (input.type === "expense" && input.fundingSource === "investments") {
    invariant(
      isLiquidAccountType(account.type),
      "INVALID_FUNDING_ACCOUNT",
      "Despesas pagas com investimentos exigem uma conta corrente, poupança ou dinheiro."
    );
  }
  if (!input.categoryId) {
    invariant(
      input.type !== "investment_contribution" && input.type !== "investment_withdrawal",
      "CATEGORY_REQUIRED",
      "Investment movements require a category."
    );
    return;
  }

  invariant(category, "CATEGORY_NOT_FOUND", "Category does not exist.", 404);
  invariant(!category.isArchived, "CATEGORY_ARCHIVED", "Cannot use an archived category.");

  if (input.type === "income") {
    invariant(
      category.group === "income",
      "CATEGORY_TYPE_MISMATCH",
      "Income transactions require an income category."
    );
  }

  if (input.type === "expense") {
    invariant(
      category.group === "fixed_expense" || category.group === "variable_expense",
      "CATEGORY_TYPE_MISMATCH",
      "Expense transactions require a fixed or variable expense category."
    );
  }

  if (isInvestmentMovementType(input.type)) {
    invariant(
      category.group === "investment",
      "CATEGORY_TYPE_MISMATCH",
      "Investment movements require an investment category."
    );
    invariant(
      isLiquidAccountType(account.type),
      "INVALID_INVESTMENT_ACCOUNT",
      "Investment movements require a checking, savings, or cash account."
    );
  }
}

export function shouldCreateInvestmentFundedExpense(values: TransactionValues) {
  const fundingSource = values.fundingSource ?? "account";

  invariant(
    fundingSource === "account" || values.type === "expense",
    "INVALID_FUNDING_SOURCE",
    "A origem Investimentos só pode ser usada em despesas manuais."
  );
  invariant(
    fundingSource !== "investments" || !values.recurringTemplateId,
    "INVALID_FUNDING_SOURCE",
    "Recorrências continuam sendo financiadas pela conta configurada."
  );

  return values.type === "expense" && fundingSource === "investments";
}

export async function investmentCheckpointFlag(
  database: TransactionDb,
  type: TransactionValues["type"],
  transactionDate: string
) {
  if (!isInvestmentMovementType(type)) {
    return true;
  }

  const portfolio = await database.query.investmentPortfolio.findFirst();
  return Boolean(portfolio && transactionDate <= portfolio.checkpointDate);
}
