"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { AccountSetupDialog, CategorySetupDialog } from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import { MonthPickerField } from "@/components/ui/month-picker-field";

export function DashboardActions({ month }: { month: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function updateMonth(nextMonth: string) {
    const params = new URLSearchParams();
    params.set("month", nextMonth);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <MonthPickerField
        month={month}
        onMonthChange={updateMonth}
        className="w-full sm:w-[240px]"
      />
      <AccountSetupDialog />
      <CategorySetupDialog />
      <Button asChild>
        <Link href={`/transactions?month=${month}`}>
          <Plus className="size-4" />
          Novo lançamento
        </Link>
      </Button>
    </div>
  );
}
