"use client";

import { useRouter } from "next/navigation";
import { MonthPickerField } from "@/components/ui/month-picker-field";
import { YearPickerField } from "@/components/ui/year-picker-field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reportHref } from "@/lib/report-periods";
import type { ReportControlsProps } from "@/lib/interfaces/reports";

export function ReportControls({ mode, period, defaultMonth, rememberedMonth }: ReportControlsProps) {
  const router = useRouter();
  const monthlyPeriod = mode === "monthly" ? period : rememberedMonth ?? defaultMonth;
  return <div className="flex max-w-full flex-wrap items-center gap-3">
    <Tabs value={mode} onValueChange={(next) => router.push(reportHref(next === "annual" ? "annual" : "monthly", next === "annual" ? period.slice(0, 4) : monthlyPeriod, monthlyPeriod))}>
      <TabsList variant="line" aria-label="Modo do relatório">
        <TabsTrigger value="monthly">Mensal</TabsTrigger>
        <TabsTrigger value="annual">Anual</TabsTrigger>
      </TabsList>
    </Tabs>
    <div className="min-w-0">
      {mode === "monthly" ? <MonthPickerField month={period} onMonthChange={(month) => { if (month) router.push(reportHref(mode, month)); }} className="w-[188px]" align="end" />
        : <YearPickerField value={period} onYearChange={(year) => router.push(reportHref("annual", year, monthlyPeriod))} className="w-[188px]" align="end" />}
    </div>
  </div>;
}
