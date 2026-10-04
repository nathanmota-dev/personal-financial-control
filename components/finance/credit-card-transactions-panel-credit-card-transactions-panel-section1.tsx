"use client";

import { CategoryBreakdown } from "@/components/finance/category-breakdown";
import { CreditCardTransactionRow } from "@/components/finance/credit-card-transaction-row";
import { TransactionEmptyState } from "@/components/finance/transaction-empty-state";
import { ViewToggle } from "@/components/finance/view-toggle";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect,NativeSelectOption } from "@/components/ui/native-select";
import type { CreditCardTransactionsPanelSection1Props } from "@/lib/interfaces/render/credit-card-transactions-panel-credit-card-transactions-panel-section1";
import { ArrowDownUp,ChartPie,Search } from "lucide-react";

export function CreditCardTransactionsPanelSection1({ entries, view, setView, query, setQuery, categoryFilter, setCategoryFilter, categories, filteredEntries, accountId, month, categoryTotals }: CreditCardTransactionsPanelSection1Props) {
  return (
<section className="min-w-0 overflow-hidden rounded-[20px] border border-border bg-card shadow-none">
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-content-strong">Extrato da fatura</h2>
              <Badge variant="outline" className="border-input text-content">{entries.length}</Badge>
            </div>
            <p className="mt-1 text-sm text-content">Compras, parcelas e ajustes lançados no ciclo selecionado.</p>
          </div>
          <div className="flex rounded-xl border border-border bg-muted/30 p-1">
            <ViewToggle
              active={view === "transactions"}
              icon={<ArrowDownUp className="size-3.5" />}
              label="Transações"
              onClick={() => setView("transactions")}
            />
            <ViewToggle
              active={view === "categories"}
              icon={<ChartPie className="size-3.5" />}
              label="Categoria"
              onClick={() => setView("categories")}
            />
          </div>
        </div>

        {view === "transactions" ? (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar uma transação</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busque por uma transação"
                className="h-10 rounded-xl border-border bg-muted/30 pl-9 text-sm placeholder:text-content-subtle"
              />
            </label>
            <NativeSelect
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full sm:w-[210px]"
            >
              <NativeSelectOption value="all">Todas as categorias</NativeSelectOption>
              {categories.map((category) => (
                <NativeSelectOption key={category.id} value={category.id}>
                  {category.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        ) : null}
      </div>

      {view === "transactions" ? (
        <div className="divide-y divide-border/80">
          {filteredEntries.length ? (
            filteredEntries.map((entry) => (
              <CreditCardTransactionRow
                key={entry.id}
                accountId={accountId}
                categories={categories}
                month={month}
                entry={entry}
              />
            ))
          ) : (
            <TransactionEmptyState query={query} />
          )}
        </div>
      ) : (
        <CategoryBreakdown categoryTotals={categoryTotals} />
      )}
    </section>
  );
}
