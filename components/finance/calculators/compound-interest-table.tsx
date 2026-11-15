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
    <div className="max-h-[368px] overflow-auto rounded-xl border border-border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead className="pl-4 text-[10px] font-bold tracking-wider text-content uppercase">Período</TableHead>
            <TableHead className="text-[10px] font-bold tracking-wider text-content uppercase">Total investido</TableHead>
            <TableHead className="text-[10px] font-bold tracking-wider text-content uppercase">Juros acumulados</TableHead>
            <TableHead className="pr-4 text-right text-[10px] font-bold tracking-wider text-content uppercase">Patrimônio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {points.map((point) => (
            <TableRow key={point.month} className="text-[13px]">
              <TableCell className="pl-4 text-content">{point.label}</TableCell>
              <TableCell className="tabular-nums text-content-strong">{formatCurrency(point.investedCents)}</TableCell>
              <TableCell className="tabular-nums text-success">{formatCurrency(point.interestCents)}</TableCell>
              <TableCell className="pr-4 text-right tabular-nums font-semibold text-content-strong">
                {formatCurrency(point.balanceCents)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
