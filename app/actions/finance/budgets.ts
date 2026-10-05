"use server";
import { requireActionSession } from "@/lib/auth/server";
import type { BudgetInput } from "@/lib/interfaces/budgets";
import { copyPreviousBudgets, removeBudget, saveBudget } from "@/lib/server/budgets";
import { runFinanceAction } from "./action-runtime";

export async function saveBudgetAction(input: BudgetInput) {
  await requireActionSession();
  return runFinanceAction(async () => { await saveBudget(input); return null; });
}
export async function removeBudgetAction(input: Omit<BudgetInput, "amountCents">) {
  await requireActionSession();
  return runFinanceAction(async () => { await removeBudget(input); return null; });
}
export async function copyPreviousBudgetsAction(month: string) {
  await requireActionSession();
  return runFinanceAction(() => copyPreviousBudgets(month));
}
