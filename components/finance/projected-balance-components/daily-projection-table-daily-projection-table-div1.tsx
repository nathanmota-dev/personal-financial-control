import { StatusBadge } from "@/components/finance/projected-balance-components/status-badge";
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table";
import { formatCurrency,formatDateLabel } from "@/lib/finance-ui";
import type { DailyProjectionTableDiv1Props } from "@/lib/interfaces/render/daily-projection-table-daily-projection-table-div1";
import { cn } from "@/lib/utils";

export function DailyProjectionTableDiv1({ daily, onSelectDay }: DailyProjectionTableDiv1Props) {
  return (
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
                    className="cursor-pointer border-border hover:bg-card"
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
  );
}
