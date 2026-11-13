"use client";

import { AlertTriangle, CalendarClock, Check, ShieldCheck, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import type {
  ProjectionAlertsProps,
  ProjectionMarginCardProps,
  ProjectionSummaryCardsProps,
} from "@/app/interfaces/projected-balance";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { formatAlertDetail, formatAlertTitle } from "./labels";

const statusCopy = {
  safe: { label: "Caixa seguro", tone: "success" },
  warning: { label: "Atenção à reserva", tone: "warning" },
  negative: { label: "Saldo negativo previsto", tone: "danger" },
} as const;

export function ProjectionSummaryCards({ summary, selectedAccountName }: ProjectionSummaryCardsProps) {
  const { formatCurrency } = useFinancialFormatter();
  const status = statusCopy[summary.status];
  const scope = selectedAccountName ?? "Consolidado das contas";
  const stats = [
    { label: "Saldo atual", value: formatCurrency(summary.initialBalanceCents), hint: scope, icon: Wallet },
    { label: "Menor saldo projetado", value: formatCurrency(summary.minimumProjectedBalanceCents), hint: formatDateLabel(summary.minimumProjectedBalanceDate), icon: TrendingDown, className: summary.minimumProjectedBalanceCents < 0 ? "text-destructive" : undefined },
    { label: summary.nextIncomeDate ? "Próxima receita" : "Fim do período", value: formatDateLabel(summary.nextIncomeDate ?? summary.endDate), hint: summary.nextIncomeDate ? "Primeira entrada encontrada" : "Sem receita futura no período", icon: CalendarClock },
    { label: "Reserva mínima", value: formatCurrency(summary.minimumReserveCents), hint: "Piso de segurança do caixa", icon: ShieldCheck },
  ];
  return (
    <section aria-label="Saldo final projetado" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/projected-balance-trend.webp" className="top-4 right-6 size-[96px]" />
      <div className="flex flex-wrap items-center gap-2 pr-24">
        <h2 className="text-sm font-semibold text-content-strong">Saldo final projetado</h2>
        <ToneChip tone={status.tone} dot>{status.label}</ToneChip>
      </div>
      <DashboardCardsMoney
        cents={summary.finalProjectedBalanceCents}
        className={cn("mt-4 block text-[48px] leading-[52px] font-bold", summary.finalProjectedBalanceCents < 0 ? "text-destructive" : "text-content-strong")}
      />
      <p className="mt-2 pr-24 text-xs text-content">{`Até ${formatDateLabel(summary.endDate)} · ${scope}`}</p>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-content"><stat.icon aria-hidden className="size-3.5 shrink-0" />{stat.label}</dt>
            <dd className={cn("mt-1 text-[15px] font-semibold text-content-strong", stat.className)}>{stat.value}</dd>
            <p className="mt-0.5 truncate text-[11px] text-content-subtle">{stat.hint}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ProjectionMarginCard({ summary }: ProjectionMarginCardProps) {
  const delta = summary.finalProjectedBalanceCents - summary.initialBalanceCents;
  const DeltaIcon = delta >= 0 ? TrendingUp : TrendingDown;
  const { formatCurrency } = useFinancialFormatter();
  return (
    <section aria-label="Disponível por dia" className="@container relative flex min-w-0 flex-col rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <h2 className="text-sm font-semibold text-content-strong">Disponível por dia</h2>
      <div className="mt-4 flex items-center justify-between gap-4">
        <DashboardCardsMoney
          cents={summary.availablePerDayCents}
          className={cn("block text-[40px] leading-[44px] font-bold", summary.availablePerDayCents < 0 ? "text-destructive" : "text-content-strong")}
        />
        <DashboardCardIllustration src="/images/balance-wallet.webp" className="relative top-auto right-auto -my-5 -mr-2 size-[80px] shrink-0" />
      </div>
      <p className="mt-2 text-xs text-content">{summary.availablePerDayCents <= 0 ? "Sem margem segura até o fim do período" : "Margem para gastar por dia até o fim do período"}</p>
      <p className={cn("mt-3 flex items-center gap-1.5 text-xs font-semibold", delta < 0 ? "text-destructive" : "text-success")}>
        <DeltaIcon aria-hidden className="size-3.5" />
        {`${formatCurrency(delta)} no período`}
      </p>
      <p className="mt-6 text-[10px] font-bold tracking-wider text-content uppercase">Alertas</p>
      <ProjectionAlerts alerts={summary.alerts} />
    </section>
  );
}

export function ProjectionAlerts({ alerts }: ProjectionAlertsProps) {
  const { protectText } = useFinancialFormatter();
  if (!alerts.length) {
    return (
      <p className="mt-3 flex items-center gap-2 text-[13px] text-content">
        <Check aria-hidden className="size-4 shrink-0 text-success" />
        Nenhum alerta no período.
      </p>
    );
  }

  return (
    <ul className="mt-1 divide-y divide-border">
      {alerts.map((alert) => {
        const danger = alert.code === "PROJECTED_BALANCE_NEGATIVE" || alert.code === "CURRENT_BALANCE_NEGATIVE";
        return (
          <li key={`${alert.code}-${alert.date ?? "period"}`} className="flex gap-3 py-3 text-[13px]">
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", danger ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
              <AlertTriangle aria-hidden className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-content-strong">{formatAlertTitle(alert)}</p>
              <p className="mt-0.5 text-xs text-content-muted">{protectText(formatAlertDetail(alert))}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
