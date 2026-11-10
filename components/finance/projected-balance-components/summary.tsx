"use client";

import { HeroPanel } from "@/components/finance/ds/hero-panel";
import { HeroStat } from "@/components/finance/ds/hero-stat";
import { ShieldCheck } from "lucide-react";

import {
AlertTriangle,
CalendarClock,
CircleDollarSign,
TrendingDown,
TrendingUp,
Wallet,
} from "lucide-react";

import type {
ProjectionAlertsProps,
ProjectionSummaryCardsProps,
} from "@/app/interfaces/projected-balance";
import { formatDateLabel } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { cn } from "@/lib/utils";

import { formatAlertDetail,formatAlertTitle } from "./labels";

const statusCopy = {
  safe: { label: "Caixa seguro", className: "bg-emerald-400/25 text-emerald-50" },
  warning: { label: "Atenção à reserva", className: "bg-amber-300/25 text-amber-50" },
  negative: { label: "Saldo negativo previsto", className: "bg-rose-400/30 text-rose-50" },
};

export function ProjectionSummaryCards({
  summary,
  selectedAccountName,
}: ProjectionSummaryCardsProps) {
  const { formatCurrency } = useFinancialFormatter();
  const availableBlocked = summary.availablePerDayCents <= 0;
  const nextIncomeValue = summary.nextIncomeDate
    ? formatDateLabel(summary.nextIncomeDate)
    : formatDateLabel(summary.endDate);

  const delta = summary.finalProjectedBalanceCents - summary.initialBalanceCents;
  const status = statusCopy[summary.status];
  return (
    <HeroPanel
      eyebrow="Saldo final projetado"
      value={formatCurrency(summary.finalProjectedBalanceCents)}
      caption={`Até ${formatDateLabel(summary.endDate)} · ${selectedAccountName ?? "Consolidado das contas"}`}
      badge={<span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", status.className)}>{status.label}</span>}
      aside={
        <div className="flex w-full flex-col justify-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-white/80"><CircleDollarSign aria-hidden="true" className="size-3.5" />Disponível por dia</p>
            <p className="mt-1 text-[28px] leading-8 font-semibold tracking-tight tabular-nums">{formatCurrency(summary.availablePerDayCents)}</p>
            <p className="mt-1 text-[11px] text-white/70">{availableBlocked ? "Sem margem segura" : "Margem até o fim do período"}</p>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-3 text-xs text-white/80">
            <span>Variação no período</span>
            <span className="flex items-center gap-1 font-semibold text-white tabular-nums">{delta >= 0 ? <TrendingUp aria-hidden="true" className="size-3.5" /> : <TrendingDown aria-hidden="true" className="size-3.5" />}{formatCurrency(delta)}</span>
          </div>
        </div>
      }
    >
      <HeroStat label="Saldo atual" value={formatCurrency(summary.initialBalanceCents)} hint={selectedAccountName ?? "Consolidado das contas"} icon={<Wallet />} />
      <HeroStat label="Menor saldo projetado" value={formatCurrency(summary.minimumProjectedBalanceCents)} hint={formatDateLabel(summary.minimumProjectedBalanceDate)} icon={<TrendingDown />} />
      <HeroStat label={summary.nextIncomeDate ? "Próxima receita" : "Fim do período"} value={nextIncomeValue} hint={summary.nextIncomeDate ? "Primeira entrada encontrada" : "Sem receita futura no período"} icon={<CalendarClock />} />
      <HeroStat label="Reserva mínima" value={formatCurrency(summary.minimumReserveCents)} hint="Piso de segurança do caixa" icon={<ShieldCheck />} />
    </HeroPanel>
  );
}

export function ProjectionAlerts({ alerts }: ProjectionAlertsProps) {
  if (!alerts.length) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {alerts.map((alert) => (
        <div
          key={`${alert.code}-${alert.date ?? "period"}`}
          className={cn(
            "flex gap-3 rounded-2xl border p-4 text-sm",
            alert.code === "PROJECTED_BALANCE_NEGATIVE" ||
              alert.code === "CURRENT_BALANCE_NEGATIVE"
              ? "border-danger/25 bg-danger/10 text-danger"
              : "border-warning/25 bg-warning/10 text-warning"
          )}
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">{formatAlertTitle(alert)}</p>
            <p className="mt-1 text-xs opacity-75">{formatAlertDetail(alert)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
