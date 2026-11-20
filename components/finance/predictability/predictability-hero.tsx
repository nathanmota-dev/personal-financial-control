"use client";

import { CalendarCheck2, CalendarDays, Receipt, Sun } from "lucide-react";

import type { PredictabilityHeroProps } from "@/app/interfaces/predictability";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { StatGrid } from "@/components/finance/ds/stat-grid";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

export function PredictabilityHero({ summary, cycle }: PredictabilityHeroProps) {
  const { formatCurrency } = useFinancialFormatter();
  const overflowing = summary.overflowCents > 0;
  const noBudget = summary.budgetCents <= 0;
  const status = overflowing
    ? { tone: "danger" as const, label: "Ciclo estourado" }
    : noBudget
      ? { tone: "danger" as const, label: "Sem orçamento" }
      : { tone: "success" as const, label: "Dentro do orçamento" };
  const stats = [
    { label: "Por dia", value: formatCurrency(summary.dailyAllowanceCents), hint: `${cycle.dayCount} dias no ciclo`, icon: CalendarDays },
    {
      label: "Hoje",
      value: summary.availableTodayCents === null ? "—" : formatCurrency(summary.availableTodayCents),
      hint: summary.availableTodayCents === null ? "Fora deste ciclo" : "Ainda livre hoje",
      icon: Sun,
    },
    { label: "Dias livres", value: String(summary.freeDays), hint: "Sem nenhum gasto à frente", icon: CalendarCheck2 },
    { label: "Gasto no ciclo", value: formatCurrency(summary.spentCents), hint: "Lançamentos avulsos", icon: Receipt },
  ];

  return (
    <section aria-label="Ainda pode gastar no ciclo" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/bills-calendar.webp" className="top-4 right-6 size-[96px]" />
      <div className="flex flex-wrap items-center gap-2 pr-24">
        <h2 className="text-sm font-semibold text-content-strong">Ainda pode gastar no ciclo</h2>
        <ToneChip tone={status.tone} dot>{status.label}</ToneChip>
      </div>
      <DashboardCardsMoney
        cents={summary.remainingCents}
        className={cn("mt-4 block text-[48px] leading-[52px] font-bold", overflowing || noBudget ? "text-destructive" : "text-content-strong")}
      />
      <p className="mt-2 pr-24 text-xs text-content">
        {`Até ${formatDateLabel(cycle.end)}, véspera do próximo salário`}
      </p>
      <StatGrid stats={stats} />
    </section>
  );
}
