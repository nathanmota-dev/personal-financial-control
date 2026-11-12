"use client";

import { CategoryBreakdown } from "@/components/finance/category-breakdown";
import { FormSelect } from "@/components/finance/form-select";
import { CreditCardTransactionRow } from "@/components/finance/credit-card-transaction-row";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { TransactionEmptyState } from "@/components/finance/transaction-empty-state";
import { ViewToggle } from "@/components/finance/view-toggle";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import { groupCreditCardEntriesByDay } from "@/lib/credit-card-view";
import type { CreditCardTransactionsPanelSection1Props } from "@/lib/interfaces/render/credit-card-transactions-panel-credit-card-transactions-panel-section1";
import { ArrowDownUp,ChartPie,Search } from "lucide-react";

export function CreditCardTransactionsPanelSection1({ entries, view, setView, query, setQuery, categoryFilter, setCategoryFilter, categories, filteredEntries, accountId, month, categoryTotals }: CreditCardTransactionsPanelSection1Props) {
  const { formatCurrency } = useFinancialFormatter();
  const totalCents = filteredEntries.reduce((sum, entry) => sum + entry.amountCents, 0);
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[20px] border border-border bg-card shadow-none">
      <DashboardCardIllustration src="/images/transactions-card-cash.webp" />
      <div className="px-[22px] pt-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold leading-[25px]">Extrato da fatura</h2>
          <Badge variant="outline" className="border-input text-content">{entries.length}</Badge>
        </div>
        <p className="mt-1 pr-16 text-xs text-content-muted">Compras, parcelas e ajustes lançados no ciclo selecionado.</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-border px-[22px] pb-5">
        {view === "transactions" ? (
          <>
            <label className="relative min-w-[200px] flex-1 sm:max-w-sm">
              <span className="sr-only">Buscar uma transação</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-content" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busque por uma transação"
                className="h-10 rounded-xl border-border bg-muted/30 pl-9 text-sm placeholder:text-content-subtle"
              />
            </label>
            <FormSelect value={categoryFilter} onValueChange={setCategoryFilter} aria-label="Filtrar por categoria" className="w-full sm:w-[210px]">
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem data-user-content key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </FormSelect>
          </>
        ) : null}
        <div className="flex w-fit max-w-full rounded-xl bg-surface p-1">
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
        {view === "transactions" ? (
          <p className="ml-auto text-xs text-content">
            {`${filteredEntries.length} ${filteredEntries.length === 1 ? "lançamento" : "lançamentos"} · `}
            <span className="font-semibold text-content-strong">{formatCurrency(totalCents)}</span>
          </p>
        ) : null}
      </div>

      {view === "transactions" ? (
        filteredEntries.length ? (
          <div className="pb-3">
            {groupCreditCardEntriesByDay(filteredEntries).map((group) => (
              <div key={group.date}>
                <p className="px-5 pt-5 pb-1 text-[11px] font-semibold tracking-wider text-content-muted sm:px-6">{group.label}</p>
                <div className="divide-y divide-border/80">
                  {group.entries.map((entry) => (
                    <CreditCardTransactionRow
                      key={entry.id}
                      accountId={accountId}
                      categories={categories}
                      month={month}
                      entry={entry}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TransactionEmptyState query={query} />
        )
      ) : (
        <CategoryBreakdown categoryTotals={categoryTotals} />
      )}
    </section>
  );
}
