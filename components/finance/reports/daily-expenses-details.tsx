"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import type { DailyExpenseDetailsProps } from "@/lib/interfaces/daily-expenses";
import { formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const entriesPerPage = 5;

function getPageItems(page: number, pageCount: number) {
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((left, right) => left - right);

  return pages.flatMap((value, index) => {
    const previous = pages[index - 1];
    return previous && value - previous > 1 ? [null, value] : [value];
  });
}

export function DailyExpensesDetails({ day }: DailyExpenseDetailsProps) {
  const { formatCurrency } = useFinancialFormatter();
  const [currentPage, setCurrentPage] = useState(1);
  const entries = day?.entries ?? [];
  const pageCount = Math.max(1, Math.ceil(entries.length / entriesPerPage));
  const firstVisibleIndex = (currentPage - 1) * entriesPerPage;
  const visibleEntries = entries.slice(firstVisibleIndex, firstVisibleIndex + entriesPerPage);
  const pageItems = getPageItems(currentPage, pageCount);

  return (
    <Card className="shadow-none" aria-live="polite">
      <CardHeader>
        <CardTitle><h3>{day ? `Movimentos de ${formatDateLabel(day.date)}` : "Detalhes do dia"}</h3></CardTitle>
        <CardDescription>{day ? `${day.entries.length} movimentos na data selecionada` : "Selecione um dia no calendário ou na tabela diária para consultar os itens."}</CardDescription>
      </CardHeader>
      {day && <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-3"><dt className="text-xs text-content-muted">Gastos positivos</dt><dd className="mt-1 font-semibold tabular-nums text-danger">{formatCurrency(day.expenseCents)}</dd></div>
          <div className="rounded-lg border border-border p-3"><dt className="text-xs text-content-muted">Créditos e estornos</dt><dd className="mt-1 font-semibold tabular-nums text-success">{formatCurrency(day.creditCents)}</dd></div>
          <div className="rounded-lg border border-border p-3"><dt className="text-xs text-content-muted">Líquido</dt><dd className="mt-1 font-semibold tabular-nums text-content-strong">{formatCurrency(day.netCents)}</dd></div>
        </dl>
        {day.entries.length ? <>
          <p className="text-xs text-content-muted" aria-live="polite">
            Exibindo {firstVisibleIndex + 1}–{Math.min(firstVisibleIndex + entriesPerPage, entries.length)} de {entries.length} movimentos
          </p>
          <ul className="divide-y divide-border">
          {visibleEntries.map((entry) => <li key={`${entry.source}-${entry.id}`} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words text-sm font-medium text-content-strong">{entry.description}</p>
                <Badge variant="outline">{entry.direction === "credit" ? "Crédito / estorno" : "Gasto"}</Badge>
                <Badge variant="secondary">{entry.source === "credit_card_charge" ? "Compra no cartão" : "Lançamento"}</Badge>
              </div>
              <p className="text-xs text-content">{entry.category} · {entry.account}</p>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
              <p className={cn("font-semibold tabular-nums", entry.direction === "credit" ? "text-success" : "text-danger")}>
                {entry.direction === "credit" ? "−" : ""}{formatCurrency(entry.amountCents)}
              </p>
              <Button asChild variant="outline" size="sm"><Link href={entry.sourceHref}>{entry.source === "credit_card_charge" ? "Abrir compra" : "Abrir lançamento"}<ArrowUpRight aria-hidden="true" /></Link></Button>
            </div>
          </li>)}
          </ul>
          {pageCount > 1 && <Pagination aria-label="Paginação dos movimentos do dia" className="justify-start">
            <PaginationContent className="flex-wrap justify-start">
              <PaginationItem>
                <PaginationPrevious
                  href="#daily-expense-details"
                  text="Anterior"
                  aria-disabled={currentPage === 1}
                  tabIndex={currentPage === 1 ? -1 : 0}
                  className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrentPage((page) => Math.max(1, page - 1));
                  }}
                />
              </PaginationItem>
              {pageItems.map((page, index) => page === null ? (
                <PaginationItem key={`ellipsis-${index}`}><PaginationEllipsis /></PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#daily-expense-details"
                    isActive={page === currentPage}
                    aria-label={`Página ${page}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage(page);
                    }}
                  >{page}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#daily-expense-details"
                  text="Próxima"
                  aria-disabled={currentPage === pageCount}
                  tabIndex={currentPage === pageCount ? -1 : 0}
                  className={cn(currentPage === pageCount && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrentPage((page) => Math.min(pageCount, page + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>}
        </> : <p className="text-sm text-content">Nenhuma despesa ou crédito registrado nesta data.</p>}
      </CardContent>}
    </Card>
  );
}
