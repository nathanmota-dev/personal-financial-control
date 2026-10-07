"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { DailyExpenseTableProps } from "@/lib/interfaces/daily-expenses";
import { formatDateLabel } from "@/lib/finance-ui";

export function DailyExpensesTable({ days, selectedDate, onSelectDate }: DailyExpenseTableProps) {
  const { formatCurrency } = useFinancialFormatter();

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle><h3>Resumo diário acessível</h3></CardTitle>
        <CardDescription>Use “Ver dia” para selecionar uma data e abrir seus movimentos. A intensidade considera somente gastos positivos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table className="tabular-nums">
          <TableCaption>Valores diários das despesas registradas por data da transação ou compra em {days.length} dias.</TableCaption>
          <TableHeader><TableRow>
            <TableHead>Data</TableHead><TableHead className="text-center">Intensidade</TableHead>
            <TableHead className="text-right">Gastos positivos</TableHead><TableHead className="text-right">Créditos e estornos</TableHead>
            <TableHead className="text-right">Líquido</TableHead><TableHead className="text-right">Movimentos</TableHead><TableHead><span className="sr-only">Detalhes</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>{days.map((day) => <TableRow key={day.date} data-state={selectedDate === day.date ? "selected" : undefined}>
            <TableCell className="font-medium">{formatDateLabel(day.date)}</TableCell>
            <TableCell className="text-center">{day.intensity}/4</TableCell>
            <TableCell className="text-right">{formatCurrency(day.expenseCents)}</TableCell>
            <TableCell className="text-right">{formatCurrency(day.creditCents)}</TableCell>
            <TableCell className="text-right">{formatCurrency(day.netCents)}</TableCell>
            <TableCell className="text-right">{day.entries.length}</TableCell>
            <TableCell><Button type="button" variant="ghost" size="sm" className="cursor-pointer" aria-pressed={selectedDate === day.date} aria-label={`Ver itens de ${formatDateLabel(day.date)}`} onClick={() => onSelectDate(day.date)}>Ver dia</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
