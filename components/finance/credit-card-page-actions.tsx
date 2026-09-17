"use client";

import { usePathname, useRouter } from "next/navigation";

import { CreditCardPurchaseDialog } from "@/components/finance/credit-card-purchase-dialog";
import { MonthPickerField } from "@/components/ui/month-picker-field";
import type { CreditCardPageActionsProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardPageActions({
  month,
  accountId,
  categories = [],
  canCreatePurchase = false,
}: CreditCardPageActionsProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
      <CreditCardMonthPicker month={month} />
      {accountId ? (
        <CreditCardPurchaseDialog
          accountId={accountId}
          categories={categories}
          month={month}
          disabled={!canCreatePurchase}
        />
      ) : null}
    </div>
  );
}

export function CreditCardMonthPicker({ month }: { month: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function updateMonth(nextMonth: string) {
    const params = new URLSearchParams();
    params.set("month", nextMonth);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <MonthPickerField
      month={month}
      onMonthChange={(nextMonth) => {
        if (nextMonth) updateMonth(nextMonth);
      }}
      className="w-full sm:w-[188px]"
    />
  );
}
