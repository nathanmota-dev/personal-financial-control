"use client";

import {
AccountSetupDialog,
CategorySetupDialog,
} from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import { MonthPickerField } from "@/components/ui/month-picker-field";
import type { DashboardActionsProps } from "@/lib/interfaces/dashboard";
import { Plus,WalletCards } from "lucide-react";
import { usePathname,useRouter,useSearchParams } from "next/navigation";
export function DashboardActions({ month }: DashboardActionsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <MonthPickerField
        month={month}
        align="end"
        className="w-full sm:w-[188px]"
        onMonthChange={(nextMonth) => {
          if (!nextMonth) return;
          const params = new URLSearchParams(searchParams.toString());
          params.set("month", nextMonth);
          router.replace(`${pathname}?${params}`);
        }}
      />
      <AccountSetupDialog
        trigger={
          <Button
            variant="secondary"
            className="h-10 w-[158px] gap-[10px] rounded-[10px] text-[13px] font-medium"
          >
            <WalletCards className="size-[17px]" />
            Cadastrar conta
          </Button>
        }
      />
      <CategorySetupDialog
        trigger={
          <Button
            variant="secondary"
            className="h-10 w-[180px] gap-[10px] rounded-[10px] text-[13px] font-medium"
          >
            <Plus className="size-[17px]" />
            Cadastrar categoria
          </Button>
        }
      />
    </div>
  );
}
