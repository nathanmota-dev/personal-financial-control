"use client";

import { ArrowUpRight, PauseCircle, Scale, TrendingUp } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { toPercent } from "@/lib/finance-tone";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { RecurringSummaryProps } from "@/lib/interfaces/recurring";
import { summarizeRecurringMonth } from "@/lib/recurring-summary";
import { cn } from "@/lib/utils";

export function RecurringSummary({ month, templates }: RecurringSummaryProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const summary = summarizeRecurringMonth(templates, month);
  const percent = toPercent(summary.generatedExpenseCents, summary.expenseCents);
  const stats = [
    { label: "Receitas fixas", value: formatCurrency(summary.incomeCents), hint: "Entradas previstas", icon: TrendingUp },
    { label: "Aportes programados", value: formatCurrency(summary.investmentCents), hint: "Investimentos automáticos", icon: ArrowUpRight },
    { label: "Sobra após fixos", value: formatCurrency(summary.freeCents), hint: "Receitas − despesas − aportes", icon: Scale, className: summary.freeCents < 0 ? "text-destructive" : "text-success" },
    { label: "Regras pausadas", value: String(summary.pausedCount), hint: `${summary.scheduledCount} ativa(s) no mês`, icon: PauseCircle },
  ];
  return (
    <section aria-label="Compromissos fixos do mês" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/recurring-repeat.webp" className="top-4 right-6 size-[96px]" />
      <h2 className="text-sm font-semibold text-content-strong">Compromissos fixos do mês</h2>
      <DashboardCardsMoney cents={summary.expenseCents} className="mt-4 block text-[48px] leading-[52px] font-bold text-content-strong" />
      <p className="mt-2 pr-24 text-xs text-content">{`Despesas recorrentes ativas previstas para ${formatMonthLabel(month)}.`}</p>
      <div className="mt-6 flex items-end justify-between gap-3">
        <p className="text-xs text-content">Já lançado no mês</p>
        <p className="text-sm font-semibold tabular-nums text-content-strong">{hidden ? "—" : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`}</p>
      </div>
      <div aria-hidden className="tone-stripes tone-neutral mt-2 h-2.5 overflow-hidden rounded-full">
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: hidden ? 0 : `${Math.min(percent, 100)}%` }} />
      </div>
      <p className="mt-1.5 flex justify-between gap-3 text-[11px] text-content-subtle">
        <span>{`Lançado ${formatCurrency(summary.generatedExpenseCents)}`}</span>
        <span>{`A lançar ${formatCurrency(summary.pendingExpenseCents)}`}</span>
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-content"><stat.icon aria-hidden className="size-3.5 shrink-0" />{stat.label}</dt>
            <dd className={cn("mt-1 text-[15px] font-semibold text-content-strong", stat.className)}>{stat.value}</dd>
            <p className="mt-0.5 text-[11px] text-content-subtle">{stat.hint}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
