"use client";

import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { CompoundInterestTableProps } from "@/lib/interfaces/compound-interest";

export function CompoundInterestTable({ points }: CompoundInterestTableProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <div className="max-h-[430px] overflow-auto rounded-2xl border border-border bg-muted/30">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-surface-raised">
          <TableRow>
            <TableHead className="pl-4">Período</TableHead>
            <TableHead>Total investido</TableHead>
            <TableHead>Juros acumulados</TableHead>
            <TableHead className="pr-4 text-right">Patrimônio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {points.map((point) => (
            <TableRow key={point.month}>
              <TableCell className="pl-4 font-medium text-content-strong">{point.label}</TableCell>
              <TableCell>{formatCurrency(point.investedCents)}</TableCell>
              <TableCell className="text-success">{formatCurrency(point.interestCents)}</TableCell>
              <TableCell className="pr-4 text-right tabular-nums font-semibold text-brand">
                {formatCurrency(point.balanceCents)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
