"use server";

import { requireActionSession } from "@/lib/auth/server";
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
applyInvestmentReduction,
getInvestmentReductionSources,
} from "@/lib/server/investment-reconciliation";
import {
configureInvestmentPortfolio,
createInvestmentContribution,
createInvestmentWithdrawal,
reconcileInvestmentBalance,
updateInvestmentSettings,
} from "@/lib/server/investments";
import { revalidateFinanceViews } from "./action-runtime";

export async function configureInvestmentPortfolioAction(
  input: Parameters<typeof configureInvestmentPortfolio>[0]
) {
  await requireActionSession();
  const result = await configureInvestmentPortfolio(input);
  revalidateFinanceViews();
  return result;
}

export async function updateInvestmentSettingsAction(
  input: Parameters<typeof updateInvestmentSettings>[0]
) {
  await requireActionSession();
  const result = await updateInvestmentSettings(input);
  revalidateFinanceViews();
  return result;
}

export async function reconcileInvestmentBalanceAction(
  input: Parameters<typeof reconcileInvestmentBalance>[0]
) {
  await requireActionSession();
  const result = await reconcileInvestmentBalance(input);
  revalidateFinanceViews();
  return result;
}

export async function getInvestmentReductionSourcesAction(
  input?: Parameters<typeof getInvestmentReductionSources>[1]
) {
  await requireActionSession();
  return getInvestmentReductionSources(undefined, input);
}

export async function applyInvestmentReductionAction(
  input: Parameters<typeof applyInvestmentReduction>[0]
) {
  await requireActionSession();
  const result = await applyInvestmentReduction(input);
  revalidateFinanceViews();
  return result;
}

export async function createInvestmentContributionAction(
  input: Parameters<typeof createInvestmentContribution>[0]
) {
  await requireActionSession();
  const result = await createInvestmentContribution(input);
  revalidateFinanceViews();
  return result;
}

export async function createInvestmentWithdrawalAction(
  input: Parameters<typeof createInvestmentWithdrawal>[0]
) {
  await requireActionSession();
  const result = await createInvestmentWithdrawal(input);
  revalidateFinanceViews();
  return result;
}

export async function createInvestmentHoldingAction(
  input: Parameters<typeof createInvestmentHolding>[0]
) {
  await requireActionSession();
  const result = await createInvestmentHolding(input);
  revalidateFinanceViews();
  return result;
}

export async function updateInvestmentHoldingAction(
  input: Parameters<typeof updateInvestmentHolding>[0]
) {
  await requireActionSession();
  const result = await updateInvestmentHolding(input);
  revalidateFinanceViews();
  return result;
}

export async function archiveInvestmentHoldingAction(id: string) {
  await requireActionSession();
  const result = await archiveInvestmentHolding(id);
  revalidateFinanceViews();
  return result;
}

export async function createInvestmentPurposeAction(
  input: Parameters<typeof createInvestmentPurpose>[0]
) {
  await requireActionSession();
  const result = await createInvestmentPurpose(input);
  revalidateFinanceViews();
  return result;
}

export async function updateInvestmentPurposeAction(
  input: Parameters<typeof updateInvestmentPurpose>[0]
) {
  await requireActionSession();
  const result = await updateInvestmentPurpose(input);
  revalidateFinanceViews();
  return result;
}

export async function archiveInvestmentPurposeAction(id: string) {
  await requireActionSession();
  const result = await archiveInvestmentPurpose(id);
  revalidateFinanceViews();
  return result;
}

export async function upsertInvestmentPurposeAllocationAction(
  input: Parameters<typeof upsertInvestmentPurposeAllocation>[0]
) {
  await requireActionSession();
  const result = await upsertInvestmentPurposeAllocation(input);
  revalidateFinanceViews();
  return result;
}

export async function deleteInvestmentPurposeAllocationAction(
  input: Parameters<typeof deleteInvestmentPurposeAllocation>[0]
) {
  await requireActionSession();
  const result = await deleteInvestmentPurposeAllocation(input);
  revalidateFinanceViews();
  return result;
}
