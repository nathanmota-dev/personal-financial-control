"use client";

import type {
DailyProjectionTableProps,
MobileDayMetricProps,
} from "@/app/interfaces/projected-balance";
import { financeItemClassName } from "@/components/finance/finance-styles";
import { StatusBadge } from "@/components/finance/projected-balance-components/status-badge";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { cn } from "@/lib/utils";
import { DailyProjectionTableDiv1 } from "./daily-projection-table-daily-projection-table-div1";

export function DailyProjectionTable({ daily, onSelectDay }: DailyProjectionTableProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <Card className="rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle>Projeção por dia</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyProjectionTableDiv1 daily={daily} onSelectDay={onSelectDay} />

          <div className="grid gap-3 md:hidden">
            {daily.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDay(day)}
                className="rounded-2xl border border-border p-4 text-left transition hover:bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-content-strong">{formatDateLabel(day.date)}</p>
                    <p className="mt-1 text-sm text-content">
                      Disponível: {formatCurrency(day.availablePerDayCents)}
                    </p>
                  </div>
                  <StatusBadge status={day.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MobileDayMetric
                    label="Entradas"
                    value={formatCurrency(day.incomeCents + day.transferInCents)}
                    className="text-warning"
                  />
                  <MobileDayMetric
                    label="Saídas"
                    value={formatCurrency(day.expenseCents + day.transferOutCents)}
                    className="text-danger"
                  />
                  <MobileDayMetric
                    label="Cartão"
                    value={formatCurrency(day.creditCardCents)}
                    className="text-brand"
                  />
                  <MobileDayMetric
                    label="Saldo"
                    value={formatCurrency(day.projectedBalanceCents)}
                    className={
                      day.projectedBalanceCents >= 0 ? "text-brand" : "text-danger"
                    }
                  />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
  );
}

function MobileDayMetric({ label, value, className }: MobileDayMetricProps) {
  return (
    <div className={cn(financeItemClassName, "p-3")}>
      <p className="text-xs text-content">{label}</p>
      <p className={cn("mt-1 font-semibold", className)}>{value}</p>
    </div>
  );
}
