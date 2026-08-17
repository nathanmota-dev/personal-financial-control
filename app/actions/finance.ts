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
  configureInvestmentPortfolio,
  createInvestmentContribution,
  createInvestmentWithdrawal,
  reconcileInvestmentBalance,
  updateInvestmentSettings,
} from "@/lib/server/investments";
import {
  applyInvestmentReduction,
  getInvestmentReductionSources,
} from "@/lib/server/investment-reconciliation";
import {
  archiveInvestmentHolding,
  archiveInvestmentPurpose,
  createInvestmentHolding,
  createInvestmentPurpose,
  deleteInvestmentPurposeAllocation,
  updateInvestmentHolding,
  updateInvestmentPurpose,
  upsertInvestmentPurposeAllocation,
} from "@/lib/server/investment-portfolio";
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
    "/investments/portfolio",
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

export async function configureInvestmentPortfolioAction(
  input: Parameters<typeof configureInvestmentPortfolio>[0]
) {
  const result = await configureInvestmentPortfolio(input);
  revalidateFinanceViews();
  return result;
}

export async function updateInvestmentSettingsAction(
  input: Parameters<typeof updateInvestmentSettings>[0]
) {
  const result = await updateInvestmentSettings(input);
  revalidateFinanceViews();
  return result;
}

export async function reconcileInvestmentBalanceAction(
  input: Parameters<typeof reconcileInvestmentBalance>[0]
) {
  const result = await reconcileInvestmentBalance(input);
  revalidateFinanceViews();
  return result;
}

export async function getInvestmentReductionSourcesAction(
  input?: Parameters<typeof getInvestmentReductionSources>[1]
) {
  return getInvestmentReductionSources(undefined, input);
}

export async function applyInvestmentReductionAction(
  input: Parameters<typeof applyInvestmentReduction>[0]
) {
  const result = await applyInvestmentReduction(input);
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

export async function createInvestmentWithdrawalAction(
  input: Parameters<typeof createInvestmentWithdrawal>[0]
) {
  const result = await createInvestmentWithdrawal(input);
  revalidateFinanceViews();
  return result;
}

export async function createInvestmentHoldingAction(
  input: Parameters<typeof createInvestmentHolding>[0]
) {
  const result = await createInvestmentHolding(input);
  revalidateFinanceViews();
  return result;
}

export async function updateInvestmentHoldingAction(
  input: Parameters<typeof updateInvestmentHolding>[0]
) {
  const result = await updateInvestmentHolding(input);
  revalidateFinanceViews();
  return result;
}

export async function archiveInvestmentHoldingAction(id: string) {
  const result = await archiveInvestmentHolding(id);
  revalidateFinanceViews();
  return result;
}

export async function createInvestmentPurposeAction(
  input: Parameters<typeof createInvestmentPurpose>[0]
) {
  const result = await createInvestmentPurpose(input);
  revalidateFinanceViews();
  return result;
}

export async function updateInvestmentPurposeAction(
  input: Parameters<typeof updateInvestmentPurpose>[0]
) {
  const result = await updateInvestmentPurpose(input);
  revalidateFinanceViews();
  return result;
}

export async function archiveInvestmentPurposeAction(id: string) {
  const result = await archiveInvestmentPurpose(id);
  revalidateFinanceViews();
  return result;
}

export async function upsertInvestmentPurposeAllocationAction(
  input: Parameters<typeof upsertInvestmentPurposeAllocation>[0]
) {
  const result = await upsertInvestmentPurposeAllocation(input);
  revalidateFinanceViews();
  return result;
}

export async function deleteInvestmentPurposeAllocationAction(
  input: Parameters<typeof deleteInvestmentPurposeAllocation>[0]
) {
  const result = await deleteInvestmentPurposeAllocation(input);
  revalidateFinanceViews();
  return result;
}
