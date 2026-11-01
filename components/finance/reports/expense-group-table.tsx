"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { ExpenseGroupCategories } from "@/components/finance/reports/expense-group-categories";
import { ExpenseGroupMobile } from "@/components/finance/reports/expense-group-mobile";
import { ReportEntrySource } from "@/components/finance/reports/entry-source";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import type { ExpenseGroupTableProps } from "@/lib/interfaces/expense-groups";

export function ExpenseGroupTable({ title, items, totalCents, groupByCategory }: ExpenseGroupTableProps) {
  const { formatCurrency } = useFinancialFormatter();
  return <section aria-label={title}><Card className="min-w-0 shadow-none">
    <CardHeader><CardTitle><h2>{title}</h2></CardTitle><CardDescription>Total do grupo: {formatCurrency(totalCents)}</CardDescription></CardHeader>
    <CardContent className="space-y-4">{items.length ? <>
      {groupByCategory ? <ExpenseGroupCategories items={items} totalCents={totalCents} /> : <>
        <div className="hidden md:block"><Table>
          <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Conta/Cartão</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((item) => <TableRow key={`${item.source}-${item.id}`}>
            <TableCell className="max-w-72 whitespace-normal"><p data-user-content className="break-words font-medium">{item.description}</p><div className="mt-2"><ReportEntrySource entry={{ source: item.source, month: item.competenceMonth }} badgeOnly /></div></TableCell>
            <TableCell data-user-content className="whitespace-normal">{item.categoryName}</TableCell><TableCell data-user-content className="whitespace-normal">{item.accountName}</TableCell>
            <TableCell>{formatDateLabel(item.expenseDate)}</TableCell><TableCell className="text-right tabular-nums">{formatCurrency(item.amountCents)}</TableCell>
          </TableRow>)}</TableBody>
          <TableFooter><TableRow><TableCell colSpan={4}>Total</TableCell><TableCell className="text-right tabular-nums">{formatCurrency(totalCents)}</TableCell></TableRow></TableFooter>
        </Table></div>
        <ul className="grid gap-3 md:hidden">{items.map((item) => <ExpenseGroupMobile key={`${item.source}-${item.id}`} item={item} />)}</ul>
      </>}
      <p className="text-right text-sm font-semibold tabular-nums md:hidden">Total: {formatCurrency(totalCents)}</p>
    </> : <FinanceEmptyState title="Sem despesas neste grupo" description="Nenhum gasto classificado neste grupo no período selecionado." />}</CardContent>
  </Card></section>;
}
