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
    <Card className="rounded-[1.75rem] border-border bg-surface/75">
      <CardHeader>
        <CardTitle>Histórico recente</CardTitle>
        <p className="text-sm text-content">
          Últimos movimentos vinculados às metas atuais.
        </p>
      </CardHeader>
      <CardContent>
        {dashboard.recentAllocations.length ? (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-content">Meta</TableHead>
                <TableHead className="text-content">Tipo</TableHead>
                <TableHead className="text-content">Data</TableHead>
                <TableHead className="text-right text-content">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.recentAllocations.map((allocation) => (
                <TableRow
                  key={allocation.id}
                  className="border-border hover:bg-surface-raised/50"
                >
                  <TableCell className="text-content-strong">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: allocation.goalColor }}
                      />
                      {allocation.goalName}
                    </span>
                  </TableCell>
                  <TableCell className="text-content">
                    {ALLOCATION_TYPE_LABELS[allocation.type]}
                  </TableCell>
                  <TableCell className="text-content">
                    {formatDateLabel(allocation.occurredOn)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      allocation.amountCents >= 0 ? "text-brand" : "text-danger"
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
