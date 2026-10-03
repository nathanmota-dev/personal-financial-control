"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, Plus, WalletCards } from "lucide-react";
import {
  AccountSetupDialog,
  CategorySetupDialog,
} from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/monthpicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DashboardActionsProps } from "@/lib/interfaces/dashboard";

const months = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
export function DashboardActions({ month }: DashboardActionsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [year, number] = month.split("-").map(Number);
  const date = new Date(year, number - 1, 1);
  const days = new Date(year, number, 0).getDate();
  const label = `1 a ${days} de ${date.toLocaleDateString("pt-BR", { month: "long" })}`;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            title={`${label} de ${year}`}
            aria-label={`Selecionar mês: ${label} de ${year}`}
            className="h-10 w-[190px] justify-between gap-2 rounded-[10px] border-0 bg-card px-[13px] text-[13px] font-semibold shadow-[0_2px_8px_#00000012]"
          >
            <CalendarDays className="size-[17px]" />
            <span>{label}</span>
            <ChevronDown className="size-3.5 text-content" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <MonthPicker
            selectedMonth={date}
            callbacks={{ monthLabel: (selected) => months[selected.number] }}
            onMonthSelect={(next) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set(
                "month",
                `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
              );
              router.replace(`${pathname}?${params}`);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
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
