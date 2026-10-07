"use client";

import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { ReportEntrySource } from "@/components/finance/reports/entry-source";
import { ReportEntryStatus } from "@/components/finance/reports/entry-status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMonthLabel, getTransactionTone, transactionTypeLabels } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { TransactionType } from "@/lib/db/schema";
import type { ReportEntriesProps } from "@/lib/interfaces/reports";

export function ReportEntriesTable({ report }: ReportEntriesProps) {
  const { formatCurrency } = useFinancialFormatter();
  return <div className="hidden md:block"><Table>
    <TableHeader><TableRow>{["Competência", "Descrição", "Tipo", "Categoria", "Conta", "Situação"].map((label) => <TableHead key={label}>{label}</TableHead>)}<TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Origem</TableHead></TableRow></TableHeader>
    <TableBody>{report.entries.map((entry) => <TableRow key={`${entry.source}-${entry.id}`}>
      <TableCell>{formatMonthLabel(entry.month)}</TableCell><TableCell className="font-medium">{entry.description}</TableCell>
      <TableCell><StatusDotBadge tone={getTransactionTone(entry.type as TransactionType)}>{transactionTypeLabels[entry.type as TransactionType]}</StatusDotBadge></TableCell>
      <TableCell>{entry.category}</TableCell><TableCell>{entry.account}</TableCell><TableCell><ReportEntryStatus entry={entry} /></TableCell>
      <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(entry.amountCents)}</TableCell><TableCell className="text-right"><ReportEntrySource entry={entry} /></TableCell>
    </TableRow>)}</TableBody>
  </Table></div>;
}
