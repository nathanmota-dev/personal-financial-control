"use client";

import { Clock3, CheckCircle2, Gauge, Layers } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { toPercent } from "@/lib/finance-tone";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { BudgetsViewProps } from "@/lib/interfaces/budgets";
import { cn } from "@/lib/utils";

export function BudgetSummary({ overview }: BudgetsViewProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const limits = overview.rows.filter((row) => row.limit);
  const planned = limits.reduce((sum, row) => sum + row.limit!.amountCents, 0);
  const used = limits.reduce((sum, row) => sum + row.committedCents, 0);
  const posted = overview.rows.reduce((sum, row) => sum + row.postedCents, 0);
  const pending = overview.rows.reduce((sum, row) => sum + row.pendingCents, 0);
  const remaining = limits.reduce((sum, row) => sum + row.remainingCents!, 0);
  const percent = toPercent(used, planned);
  const meterColor = percent >= 100 ? "bg-destructive" : percent >= 80 ? "bg-warning" : "bg-primary";
  const stats = [
    { label: "Limites do mês", value: planned, hint: `${limits.length} categoria(s)`, icon: Layers },
    { label: "Realizado", value: posted, hint: "Efetivado no mês", icon: CheckCircle2 },
    { label: "Pendente", value: pending, hint: "Ainda não efetivado", icon: Clock3 },
    { label: "Comprometido", value: overview.committedCents, hint: "Realizado + pendente", icon: Gauge },
  ];
  return (
    <section aria-label="Saldo dos limites" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/budgets-clipboard.webp" className="top-4 right-6 size-[96px]" />
      <h2 className="text-sm font-semibold text-content-strong">Saldo dos limites</h2>
      {limits.length ? (
        <DashboardCardsMoney cents={remaining} className={cn("mt-4 block text-[48px] leading-[52px] font-bold", remaining < 0 ? "text-destructive" : "text-content-strong")} />
      ) : (
        <p className="mt-4 text-[48px] leading-[52px] font-bold tracking-tight text-content-strong">Sem limites</p>
      )}
      <p className="mt-2 pr-24 text-xs text-content">
        {limits.length ? `Disponível nas categorias com limite em ${formatMonthLabel(overview.month)}.` : `Defina limites para acompanhar o consumo de ${formatMonthLabel(overview.month)}.`}
      </p>
      <div className="mt-6 flex items-end justify-between gap-3">
        <p className="text-xs text-content">Consumo dos limites</p>
        <p className="text-sm font-semibold tabular-nums text-content-strong">{hidden ? "—" : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`}</p>
      </div>
      <div aria-hidden className="tone-stripes tone-neutral mt-2 h-2.5 overflow-hidden rounded-full">
        <div className={cn("h-full rounded-full transition-[width] duration-500", meterColor)} style={{ width: hidden ? 0 : `${Math.min(percent, 100)}%` }} />
      </div>
      <p className="mt-1.5 flex justify-between gap-3 text-[11px] text-content-subtle">
        <span>{`Usado ${formatCurrency(used)}`}</span>
        <span>{`de ${formatCurrency(planned)}`}</span>
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="flex items-center gap-1.5 text-xs text-content"><stat.icon aria-hidden className="size-3.5" />{stat.label}</dt>
            <dd className="mt-1 text-[15px] font-semibold text-content-strong">{formatCurrency(stat.value)}</dd>
            <p className="mt-0.5 text-[11px] text-content-subtle">{stat.hint}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
