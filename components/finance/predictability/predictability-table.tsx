"use client";

import type { PredictabilityTableProps } from "@/app/interfaces/predictability";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PredictabilityMobileDay } from "./predictability-mobile-day";
import { PredictabilityTableRow } from "./predictability-table-row";

export function PredictabilityTable({ days, overflowCents, onSelectDay }: PredictabilityTableProps) {
  const { formatCurrency } = useFinancialFormatter();
  const totals = days.reduce(
    (sum, day) => ({
      allowance: sum.allowance + day.allowanceCents,
      spent: sum.spent + day.spentCents,
      consumed: sum.consumed + day.consumedCents,
      remaining: sum.remaining + day.remainingCents,
    }),
    { allowance: 0, spent: 0, consumed: 0, remaining: 0 }
  );

  return (
    <div className="border-t border-border px-[22px] pt-2 pb-6">
      <h3 className="sr-only">Orçamento por dia</h3>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dia</TableHead>
              <TableHead className="text-right">Valor do dia</TableHead>
              <TableHead className="text-right">Gasto no dia</TableHead>
              <TableHead className="text-right">Consumido</TableHead>
              <TableHead className="text-right">Restante</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((day) => (
              <PredictabilityTableRow key={day.date} day={day} onSelectDay={onSelectDay} />
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="border-border">
              <TableCell className="font-semibold text-content-strong">Total do ciclo</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(totals.allowance)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums text-danger">{formatCurrency(totals.spent)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(totals.consumed)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(totals.remaining)}</TableCell>
              <TableCell className="text-xs font-semibold text-danger">
                {overflowCents > 0 ? <>Estouro de {formatCurrency(overflowCents)}</> : null}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {days.map((day) => (
          <PredictabilityMobileDay key={day.date} day={day} onSelectDay={onSelectDay} />
        ))}
        <p className="text-sm text-content">
          Restam <span className="font-semibold text-content-strong">{formatCurrency(totals.remaining)}</span> no ciclo
          {overflowCents > 0 ? <span className="font-semibold text-danger"> · estouro de {formatCurrency(overflowCents)}</span> : null}
        </p>
      </div>
    </div>
  );
}
