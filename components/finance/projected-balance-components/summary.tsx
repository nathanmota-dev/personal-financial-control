import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import type {
  MetricCardProps,
  ProjectionAlertsProps,
  ProjectionSummaryCardsProps,
} from "@/app/interfaces/projected-balance";
import { financeIconClassName } from "@/components/finance/finance-styles";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { formatAlertDetail, formatAlertTitle } from "./labels";

export function ProjectionSummaryCards({
  summary,
  selectedAccountName,
}: ProjectionSummaryCardsProps) {
  const availableBlocked = summary.availablePerDayCents <= 0;
  const nextIncomeValue = summary.nextIncomeDate
    ? formatDateLabel(summary.nextIncomeDate)
    : formatDateLabel(summary.endDate);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Saldo atual"
        value={formatCurrency(summary.initialBalanceCents)}
        description={selectedAccountName ?? "Consolidado das contas"}
        icon={<Wallet className="size-4" />}
        tone={summary.initialBalanceCents >= 0 ? "cyan" : "rose"}
      />
      <MetricCard
        label="Disponível por dia"
        value={formatCurrency(summary.availablePerDayCents)}
        description={availableBlocked ? "Sem margem segura" : "Margem até o fim do período"}
        icon={<CircleDollarSign className="size-4" />}
        tone={
          availableBlocked
            ? summary.status === "negative"
              ? "rose"
              : "amber"
            : "emerald"
        }
      />
      <MetricCard
        label="Saldo final projetado"
        value={formatCurrency(summary.finalProjectedBalanceCents)}
        description={`Até ${formatDateLabel(summary.endDate)}`}
        icon={<TrendingUp className="size-4" />}
        tone={summary.finalProjectedBalanceCents >= 0 ? "cyan" : "rose"}
      />
      <MetricCard
        label="Menor saldo projetado"
        value={formatCurrency(summary.minimumProjectedBalanceCents)}
        description={formatDateLabel(summary.minimumProjectedBalanceDate)}
        icon={<TrendingDown className="size-4" />}
        tone={
          summary.status === "safe"
            ? "sky"
            : summary.status === "warning"
              ? "amber"
              : "rose"
        }
      />
      <MetricCard
        label={summary.nextIncomeDate ? "Próxima receita" : "Fim do período"}
        value={nextIncomeValue}
        description={
          summary.nextIncomeDate
            ? "Primeira entrada encontrada"
            : "Sem receita futura no período"
        }
        icon={<CalendarClock className="size-4" />}
        tone={summary.nextIncomeDate ? "emerald" : "amber"}
      />
    </section>
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
            "flex gap-3 rounded-[1.25rem] border p-4 text-sm",
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

function MetricCard({ label, value, description, icon, tone }: MetricCardProps) {
  const tones = {
    cyan: "text-brand bg-brand/10",
    emerald: "text-warning bg-warning/10",
    sky: "text-brand bg-brand/10",
    amber: "text-warning bg-warning/10",
    rose: "text-danger bg-danger/10",
  } as const;

  return (
    <Card className="rounded-[1.5rem] border-border bg-surface/75">
      <CardContent className="space-y-3 pt-6">
        <div className={cn(financeIconClassName, tones[tone])}>{icon}</div>
        <div>
          <p className="text-sm text-content">{label}</p>
          <p className={cn("font-heading text-2xl font-semibold tracking-tight", tones[tone])}>
            {value}
          </p>
        </div>
        <p className="text-sm leading-6 text-content">{description}</p>
      </CardContent>
    </Card>
  );
}
