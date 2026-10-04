"use server";

import { requireActionSession } from "@/lib/auth/server";
import { archiveAccount,createAccount,updateAccount } from "@/lib/server/accounts";
import {
archiveCategory,
createCategory,
deleteCategory,
updateCategory,
} from "@/lib/server/categories";
import { createTransaction,deleteTransaction,updateTransaction } from "@/lib/server/transactions";
import { revalidateFinanceViews,runFinanceAction } from "./action-runtime";

export async function createAccountAction(input: Parameters<typeof createAccount>[0]) {
  await requireActionSession();
  const result = await createAccount(input);
  revalidateFinanceViews();
  return result;
}

export async function updateAccountAction(input: Parameters<typeof updateAccount>[0]) {
  await requireActionSession();
  const result = await updateAccount(input);
  revalidateFinanceViews();
  return result;
}

export async function archiveAccountAction(id: string) {
  await requireActionSession();
  const result = await archiveAccount(id);
  revalidateFinanceViews();
  return result;
}

export async function createCategoryAction(input: Parameters<typeof createCategory>[0]) {
  await requireActionSession();
  const result = await createCategory(input);
  revalidateFinanceViews();
  return result;
}

export async function updateCategoryAction(input: Parameters<typeof updateCategory>[0]) {
  await requireActionSession();
  const result = await updateCategory(input);
  revalidateFinanceViews();
  return result;
}

export async function archiveCategoryAction(id: string) {
  await requireActionSession();
  const result = await archiveCategory(id);
  revalidateFinanceViews();
  return result;
}

export async function deleteCategoryAction(id: string) {
  await requireActionSession();
  await deleteCategory(id);
  revalidateFinanceViews();
}

export async function createTransactionAction(input: Parameters<typeof createTransaction>[0]) {
  await requireActionSession();
  return runFinanceAction(() => createTransaction(input));
}

export async function updateTransactionAction(input: Parameters<typeof updateTransaction>[0]) {
  await requireActionSession();
  return runFinanceAction(() => updateTransaction(input));
}

export async function deleteTransactionAction(id: string) {
  await requireActionSession();
  return runFinanceAction(async () => {
    await deleteTransaction(id);
    return null;
  });
}
