"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { summarizeExpenseGroupCategories } from "@/lib/expense-groups";
import { formatExpenseShare } from "@/lib/expense-groups-presentation";
import type { ExpenseGroupCategoriesProps } from "@/lib/interfaces/expense-groups";

export function ExpenseGroupCategories({ items, totalCents }: ExpenseGroupCategoriesProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  const categories = summarizeExpenseGroupCategories(items, totalCents);
  return <>
    <div className="hidden md:block"><Table>
      <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="text-right">Ocorrências</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">% do grupo</TableHead></TableRow></TableHeader>
      <TableBody>{categories.map((category) => <TableRow key={category.id ?? "uncategorized"}>
        <TableCell data-user-content>{category.name}</TableCell><TableCell className="text-right">{category.count}</TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(category.amountCents)}</TableCell><TableCell className="text-right">{protect(formatExpenseShare(category.share))}</TableCell>
      </TableRow>)}</TableBody>
      <TableFooter><TableRow><TableCell colSpan={2}>Total</TableCell><TableCell className="text-right tabular-nums">{formatCurrency(totalCents)}</TableCell><TableCell /></TableRow></TableFooter>
    </Table></div>
    <ul className="grid gap-3 md:hidden">{categories.map((category) => <li key={category.id ?? "uncategorized"} className="min-w-0 rounded-2xl border border-border p-4">
      <p data-user-content className="break-words font-medium">{category.name}</p><p className="mt-2 font-semibold tabular-nums">{formatCurrency(category.amountCents)}</p>
      <p className="mt-2 text-xs text-content">Ocorrências: {category.count} · {protect(formatExpenseShare(category.share))} do grupo</p>
    </li>)}</ul>
  </>;
}
