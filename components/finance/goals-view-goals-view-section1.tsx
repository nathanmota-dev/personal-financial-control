"use client";

import { CalendarClock, Flag, PiggyBank, ShieldCheck } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { toPercent } from "@/lib/finance-tone";
import type { GoalsViewSection1Props } from "@/lib/interfaces/render/goals-view-goals-view-section1";
import { cn } from "@/lib/utils";

export function GoalsViewSection1({ dashboard }: GoalsViewSection1Props) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const { summary } = dashboard;
  const neededCents = summary.totalAllocatedCents + summary.remainingToGoalsCents;
  const percent = toPercent(summary.totalAllocatedCents, neededCents);
  const stats = [
    { label: "Investido total", value: summary.investmentBalanceCents, hint: "Saldo consolidado da carteira", icon: PiggyBank },
    { label: "Reserva livre", value: summary.freeReserveCents, hint: "Fora de qualquer meta", icon: ShieldCheck, className: summary.freeReserveCents < 0 ? "text-destructive" : undefined },
    { label: "Falta para metas", value: summary.remainingToGoalsCents, hint: `${summary.goalCount} meta(s) atuais`, icon: Flag },
    { label: "Aporte mensal necessário", value: summary.monthlyRequiredCents, hint: "Para cumprir os prazos", icon: CalendarClock },
  ];
  return (
    <section aria-label="Alocado em metas" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/goals-target.webp" className="top-4 right-6 size-[96px]" />
      <h2 className="text-sm font-semibold text-content-strong">Alocado em metas</h2>
      <DashboardCardsMoney cents={summary.totalAllocatedCents} className="mt-4 block text-[48px] leading-[52px] font-bold text-content-strong" />
      <p className="mt-2 pr-24 text-xs text-content">Parte da carteira que já está reservada para objetivos futuros.</p>
      <div className="mt-6 flex items-end justify-between gap-3">
        <p className="text-xs text-content">Progresso geral das metas</p>
        <p className="text-sm font-semibold tabular-nums text-content-strong">{hidden ? "—" : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`}</p>
      </div>
      <div aria-hidden className="tone-stripes tone-neutral mt-2 h-2.5 overflow-hidden rounded-full">
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: hidden ? 0 : `${Math.min(percent, 100)}%` }} />
      </div>
      <p className="mt-1.5 flex justify-between gap-3 text-[11px] text-content-subtle">
        <span>{`Alocado ${formatCurrency(summary.totalAllocatedCents)}`}</span>
        <span>{`de ${formatCurrency(neededCents)}`}</span>
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-content"><stat.icon aria-hidden className="size-3.5 shrink-0" />{stat.label}</dt>
            <dd className={cn("mt-1 text-[15px] font-semibold text-content-strong", stat.className)}>{formatCurrency(stat.value)}</dd>
            <p className="mt-0.5 text-[11px] text-content-subtle">{stat.hint}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
