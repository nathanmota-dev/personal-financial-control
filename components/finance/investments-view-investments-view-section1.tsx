"use client";

import { CalendarClock, Flag, Percent, TrendingUp } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel, formatRateFromBps } from "@/lib/finance-ui";
import type { InvestmentsViewSection1Props } from "@/lib/interfaces/render/investments-view-investments-view-section1";

export function InvestmentsViewSection1({ projection }: InvestmentsViewSection1Props) {
  const { formatCurrency } = useFinancialFormatter();
  const stats = [
    { label: "Rendimento estimado", value: projection ? formatCurrency(projection.estimatedInterestCents) : formatCurrency(0), hint: projection ? `Desde ${formatDateLabel(projection.checkpointDate)}` : "Calculado entre conferências", icon: TrendingUp },
    { label: "Próximo aporte previsto", value: projection?.nextContributionDate ? formatDateLabel(projection.nextContributionDate) : "Nenhum", hint: projection ? "Pelas recorrências e lançamentos" : "Use uma recorrência para planejar", icon: CalendarClock },
    { label: "Taxa esperada", value: projection ? formatRateFromBps(projection.expectedMonthlyRateBps) : "—", hint: "Usada na estimativa diária", icon: Percent },
    { label: "Saldo de referência", value: projection ? formatCurrency(projection.checkpointBalanceCents) : "—", hint: projection ? formatDateLabel(projection.checkpointDate) : "Sem conferência", icon: Flag },
  ];
  return (
    <section aria-label="Saldo estimado hoje" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/balance-wallet.webp" className="top-4 right-6 size-[96px]" />
      <h2 className="text-sm font-semibold text-content-strong">Saldo estimado hoje</h2>
      <DashboardCardsMoney cents={projection?.currentBalanceCents ?? 0} className="mt-4 block text-[48px] leading-[52px] font-bold text-content-strong" />
      <p className="mt-2 pr-24 text-xs text-content">{projection ? `Conferido em ${formatDateLabel(projection.checkpointDate)} e atualizado pela taxa e pelos lançamentos.` : "Configure o primeiro saldo de referência para acompanhar a reserva."}</p>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-content"><stat.icon aria-hidden className="size-3.5 shrink-0" />{stat.label}</dt>
            <dd className="mt-1 text-[15px] font-semibold text-content-strong">{stat.value}</dd>
            <p className="mt-0.5 text-[11px] text-content-subtle">{stat.hint}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
