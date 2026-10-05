"use client";

import { usePathname, useRouter } from "next/navigation";
import { MonthPickerField } from "@/components/ui/month-picker-field";
import type { BudgetFormProps } from "@/lib/interfaces/budgets";
import { BudgetCopy } from "./budget-copy";
import { BudgetDialog } from "./budget-dialog";

export function BudgetActions({ month, categories }: BudgetFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="flex max-w-full flex-wrap items-center gap-3">
      <MonthPickerField month={month} className="w-[188px]" align="end" onMonthChange={(next) => { if (next) router.replace(`${pathname}?${new URLSearchParams({ month: next })}`); }} />
      <BudgetCopy month={month} />
      <BudgetDialog month={month} categories={categories} />
    </div>
  );
}
