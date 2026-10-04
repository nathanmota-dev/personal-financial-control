"use server";

import { requireActionSession } from "@/lib/auth/server";
import {
archiveOperationalInvestmentAsset,
createInvestmentOperation,
createOperationalInvestmentAsset,
deleteInvestmentOperation,
refreshInvestmentQuotes,
registerManualInvestmentQuote,
updateFixedIncomeTerms,
updateInvestmentOperation,
updateManualInvestmentBalance,
updateOperationalInvestmentAsset,
} from "@/lib/server/investment-operations";
import { runFinanceAction } from "./action-runtime";

export async function createOperationalInvestmentAssetAction(input: Parameters<typeof createOperationalInvestmentAsset>[0]) {
  await requireActionSession();
  return runFinanceAction(() => createOperationalInvestmentAsset(input));
}

export async function createInvestmentOperationAction(input: Parameters<typeof createInvestmentOperation>[0]) {
  await requireActionSession();
  return runFinanceAction(() => createInvestmentOperation(input));
}

export async function updateInvestmentOperationAction(id: string, input: Parameters<typeof updateInvestmentOperation>[1]) {
  await requireActionSession();
  return runFinanceAction(() => updateInvestmentOperation(id, input));
}

export async function deleteInvestmentOperationAction(id: string) {
  await requireActionSession();
  return runFinanceAction(async () => { await deleteInvestmentOperation(id); return null; });
}

export async function registerManualInvestmentQuoteAction(input: Parameters<typeof registerManualInvestmentQuote>[0]) {
  await requireActionSession();
  return runFinanceAction(() => registerManualInvestmentQuote(input));
}

export async function updateManualInvestmentBalanceAction(input: Parameters<typeof updateManualInvestmentBalance>[0]) {
  await requireActionSession();
  return runFinanceAction(async () => { await updateManualInvestmentBalance(input); return null; });
}

export async function updateFixedIncomeTermsAction(input: Parameters<typeof updateFixedIncomeTerms>[0]) {
  await requireActionSession();
  return runFinanceAction(async () => { await updateFixedIncomeTerms(input); return null; });
}

export async function refreshInvestmentQuotesAction() {
  await requireActionSession();
  return runFinanceAction(() => refreshInvestmentQuotes());
}

export async function updateOperationalInvestmentAssetAction(id: string, input: Parameters<typeof updateOperationalInvestmentAsset>[1]) {
  await requireActionSession();
  return runFinanceAction(() => updateOperationalInvestmentAsset(id, input));
}

export async function archiveOperationalInvestmentAssetAction(id: string) {
  await requireActionSession();
  return runFinanceAction(async () => { await archiveOperationalInvestmentAsset(id); return null; });
}
