import { FinanceEmptyState } from "@/components/finance/empty-state";
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

import { ALLOCATION_TYPE_LABELS } from "../goals-constants";
import type { RecentAllocationsCardProps } from "../goals-types";

export function RecentAllocationsCard({ dashboard }: RecentAllocationsCardProps) {
  return (
    <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
      <CardHeader>
        <CardTitle>Histórico recente</CardTitle>
        <p className="text-sm text-slate-400">
          Últimos movimentos vinculados às metas atuais.
        </p>
      </CardHeader>
      <CardContent>
        {dashboard.recentAllocations.length ? (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Meta</TableHead>
                <TableHead className="text-slate-400">Tipo</TableHead>
                <TableHead className="text-slate-400">Data</TableHead>
                <TableHead className="text-right text-slate-400">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.recentAllocations.map((allocation) => (
                <TableRow
                  key={allocation.id}
                  className="border-slate-800 hover:bg-slate-900/50"
                >
                  <TableCell className="text-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: allocation.goalColor }}
                      />
                      {allocation.goalName}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {ALLOCATION_TYPE_LABELS[allocation.type]}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {formatDateLabel(allocation.occurredOn)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      allocation.amountCents >= 0 ? "text-cyan-200" : "text-rose-200"
                    )}
                  >
                    {formatCurrency(allocation.amountCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <FinanceEmptyState
            title="Sem movimentações"
            description="Alocações, liberações e aportes vinculados às metas aparecerão nesta tabela."
          />
        )}
      </CardContent>
    </Card>
  );
}
