"use server";

import { requireActionSession } from "@/lib/auth/server";
import {
createCreditCardCharge,
deleteCreditCardCharge,
updateCreditCardCharge,
} from "@/lib/server/credit-card";
import {
createRecurringTemplate,
deleteRecurringTemplate,
generateRecurringTransactions,
pauseRecurringTemplate,
updateRecurringTemplate,
} from "@/lib/server/recurring";
import { createTransfer } from "@/lib/server/transfers";
import { revalidateFinanceViews,runFinanceAction } from "./action-runtime";

export async function createTransferAction(input: Parameters<typeof createTransfer>[0]) {
  await requireActionSession();
  const result = await createTransfer(input);
  revalidateFinanceViews();
  return result;
}

export async function createCreditCardChargeAction(
  input: Parameters<typeof createCreditCardCharge>[0]
) {
  await requireActionSession();
  const result = await createCreditCardCharge(input);
  revalidateFinanceViews();
  return result;
}

export async function updateCreditCardChargeAction(
  input: Parameters<typeof updateCreditCardCharge>[0]
) {
  await requireActionSession();
  const result = await updateCreditCardCharge(input);
  revalidateFinanceViews();
  return result;
}

export async function deleteCreditCardChargeAction(id: string) {
  await requireActionSession();
  await deleteCreditCardCharge(id);
  revalidateFinanceViews();
}

export async function createRecurringTemplateAction(
  input: Parameters<typeof createRecurringTemplate>[0]
) {
  await requireActionSession();
  return runFinanceAction(() => createRecurringTemplate(input));
}

export async function updateRecurringTemplateAction(
  input: Parameters<typeof updateRecurringTemplate>[0]
) {
  await requireActionSession();
  return runFinanceAction(() => updateRecurringTemplate(input));
}

export async function pauseRecurringTemplateAction(id: string) {
  await requireActionSession();
  return runFinanceAction(() => pauseRecurringTemplate(id));
}

export async function deleteRecurringTemplateAction(
  id: string,
  mode: Parameters<typeof deleteRecurringTemplate>[1]
) {
  await requireActionSession();
  return runFinanceAction(async () => {
    await deleteRecurringTemplate(id, mode);
    return null;
  });
}

export async function generateRecurringTransactionsAction(month: string) {
  await requireActionSession();
  return runFinanceAction(() => generateRecurringTransactions(month));
}
