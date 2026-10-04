"use client";

import {
Coins,
Plus
} from "lucide-react";
import { HoldingsTableDiv2 } from "./holdings-table-holdings-table-div2";
import { HoldingsTableTableBody1 } from "./holdings-table-holdings-table-table-body1";

import { financePanelClassName } from "@/components/finance/finance-styles";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import {
Table,
TableHead,
TableHeader,
TableRow
} from "@/components/ui/table";
import type { HoldingsTableProps } from "@/lib/interfaces/investment-portfolio";

export function HoldingsTable({
  dashboard,
  onCreate,
  onEdit,
  onAllocate,
  onEditAllocation,
  onArchive,
}: HoldingsTableProps) {
  return (
    <Card className={financePanelClassName}>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-brand">
            <Coins className="size-4" />
            <span className="text-[0.68rem] font-semibold">
              Registro manual
            </span>
          </div>
          <CardTitle className="text-xl text-content-strong">Posições cadastradas</CardTitle>
          <p className="mt-1 text-sm leading-6 text-content">
            Informe o valor atual de cada posição. Quantidade, preço médio e cotações automáticas
            ficam fora desta primeira versão.
          </p>
        </div>
        <Button type="button" onClick={onCreate}>
          <Plus className="size-4" />
          Novo ativo
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border/80 hover:bg-transparent">
                <TableHead className="pl-6 text-content">Ativo</TableHead>
                <TableHead className="text-content">Classe / tipo</TableHead>
                <TableHead className="text-right text-content">Atual</TableHead>
                <TableHead className="text-right text-content">Alocado</TableHead>
                <TableHead className="text-right text-content">Livre</TableHead>
                <TableHead className="text-content">Valor em</TableHead>
                <TableHead className="pr-6 text-right text-content">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <HoldingsTableTableBody1 dashboard={dashboard} onEditAllocation={onEditAllocation} onEdit={onEdit} onAllocate={onAllocate} onArchive={onArchive} />
          </Table>
        </div>

        <HoldingsTableDiv2 dashboard={dashboard} onEdit={onEdit} onAllocate={onAllocate} onArchive={onArchive} onEditAllocation={onEditAllocation} onCreate={onCreate} />
      </CardContent>
    </Card>
  );
}
