"use server";

import { revalidatePath } from "next/cache";

import { archiveAccount, createAccount, updateAccount } from "@/lib/server/accounts";
import {
  archiveCategory,
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/server/categories";
import {
  createInvestmentContribution,
  saveInvestmentPortfolio,
} from "@/lib/server/investments";
import {
  createRecurringTemplate,
  endRecurringTemplate,
  generateRecurringTransactions,
  pauseRecurringTemplate,
  updateRecurringTemplate,
} from "@/lib/server/recurring";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { createTransaction, deleteTransaction, updateTransaction } from "@/lib/server/transactions";
import { createTransfer } from "@/lib/server/transfers";

function revalidateFinanceViews() {
  [
    "/",
    "/dashboard",
    "/transactions",
    "/recurring",
    "/projected-balance",
    "/investments",
    "/goals",
    "/credit-card",
  ].forEach((path) => {
    revalidatePath(path);
  });
}

export async function createAccountAction(input: Parameters<typeof createAccount>[0]) {
  const result = await createAccount(input);
  revalidateFinanceViews();
  return result;
}

export async function updateAccountAction(input: Parameters<typeof updateAccount>[0]) {
  const result = await updateAccount(input);
  revalidateFinanceViews();
  return result;
}

export async function archiveAccountAction(id: string) {
  const result = await archiveAccount(id);
  revalidateFinanceViews();
  return result;
}

export async function createCategoryAction(input: Parameters<typeof createCategory>[0]) {
  const result = await createCategory(input);
  revalidateFinanceViews();
  return result;
}

export async function updateCategoryAction(input: Parameters<typeof updateCategory>[0]) {
  const result = await updateCategory(input);
  revalidateFinanceViews();
  return result;
}

export async function archiveCategoryAction(id: string) {
  const result = await archiveCategory(id);
  revalidateFinanceViews();
  return result;
}

export async function deleteCategoryAction(id: string) {
  await deleteCategory(id);
  revalidateFinanceViews();
}

export async function createTransactionAction(input: Parameters<typeof createTransaction>[0]) {
  const result = await createTransaction(input);
  revalidateFinanceViews();
  return result;
}

export async function updateTransactionAction(input: Parameters<typeof updateTransaction>[0]) {
  const result = await updateTransaction(input);
  revalidateFinanceViews();
  return result;
}

export async function deleteTransactionAction(id: string) {
  await deleteTransaction(id);
  revalidateFinanceViews();
}

export async function createTransferAction(input: Parameters<typeof createTransfer>[0]) {
  const result = await createTransfer(input);
  revalidateFinanceViews();
  return result;
}

export async function createCreditCardChargeAction(
  input: Parameters<typeof createCreditCardCharge>[0]
) {
  const result = await createCreditCardCharge(input);
  revalidateFinanceViews();
  return result;
}

export async function createRecurringTemplateAction(
  input: Parameters<typeof createRecurringTemplate>[0]
) {
  const result = await createRecurringTemplate(input);
  revalidateFinanceViews();
  return result;
}

export async function updateRecurringTemplateAction(
  input: Parameters<typeof updateRecurringTemplate>[0]
) {
  const result = await updateRecurringTemplate(input);
  revalidateFinanceViews();
  return result;
}

export async function pauseRecurringTemplateAction(id: string) {
  const result = await pauseRecurringTemplate(id);
  revalidateFinanceViews();
  return result;
}

export async function endRecurringTemplateAction(id: string, endMonth: string) {
  const result = await endRecurringTemplate(id, endMonth);
  revalidateFinanceViews();
  return result;
}

export async function generateRecurringTransactionsAction(month: string) {
  const result = await generateRecurringTransactions(month);
  revalidateFinanceViews();
  return result;
}

export async function saveInvestmentPortfolioAction(
  input: Parameters<typeof saveInvestmentPortfolio>[0]
) {
  const result = await saveInvestmentPortfolio(input);
  revalidateFinanceViews();
  return result;
}

export async function createInvestmentContributionAction(
  input: Parameters<typeof createInvestmentContribution>[0]
) {
  const result = await createInvestmentContribution(input);
  revalidateFinanceViews();
  return result;
}
