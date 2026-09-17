import type {
  DailyProjectionTableProps,
  MobileDayMetricProps,
} from "@/app/interfaces/projected-balance";
import { financeItemClassName } from "@/components/finance/finance-styles";
import { StatusBadge } from "@/components/finance/projected-balance-components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

export function DailyProjectionTable({ daily, onSelectDay }: DailyProjectionTableProps) {
  return (
    <Card className="rounded-[1.75rem] border-border bg-surface/75">
        <CardHeader>
          <CardTitle>Projeção por dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="text-right">Investimentos líquidos</TableHead>
                  <TableHead className="text-right">Cartão</TableHead>
                  <TableHead className="text-right">Saldo projetado</TableHead>
                  <TableHead className="text-right">Disponível/dia</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daily.map((day) => (
                  <TableRow
                    key={day.date}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectDay(day)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        onSelectDay(day);
                      }
                    }}
                    className="cursor-pointer border-border hover:bg-surface-raised/80"
                  >
                    <TableCell className="font-medium text-content-strong">
                      {formatDateLabel(day.date)}
                    </TableCell>
                    <TableCell className="text-right text-warning">
                      {formatCurrency(day.incomeCents + day.transferInCents)}
                    </TableCell>
                    <TableCell className="text-right text-danger">
                      {formatCurrency(day.expenseCents + day.transferOutCents)}
                    </TableCell>
                    <TableCell className="text-right text-brand">
                      {formatCurrency(day.investmentCents)}
                    </TableCell>
                    <TableCell className="text-right text-brand">
                      {formatCurrency(day.creditCardCents)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        day.projectedBalanceCents >= 0 ? "text-brand" : "text-danger"
                      )}
                    >
                      {formatCurrency(day.projectedBalanceCents)}
                    </TableCell>
                    <TableCell className="text-right text-content-strong">
                      {formatCurrency(day.availablePerDayCents)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={day.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {daily.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDay(day)}
                className="rounded-2xl border border-border p-4 text-left transition hover:bg-surface-raised/70"
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
      <p className="text-xs text-content-strong0">{label}</p>
      <p className={cn("mt-1 font-semibold", className)}>{value}</p>
    </div>
  );
}
