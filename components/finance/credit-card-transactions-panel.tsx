"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, ChartPie, MoreHorizontal, Search, Tag } from "lucide-react";

import { CreditCardChargeActions } from "@/components/finance/credit-card-charge-actions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { formatCreditCardMonth } from "@/lib/credit-card-view";
import { formatCurrency } from "@/lib/finance-ui";
import type { CreditCardTransactionsPanelProps } from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";

type TransactionView = "transactions" | "categories";

export function CreditCardTransactionsPanel({
  accountId,
  categories,
  month,
  entries,
  categoryTotals,
}: CreditCardTransactionsPanelProps) {
  const [view, setView] = useState<TransactionView>("transactions");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

    return entries.filter((entry) => {
      const matchesQuery = !normalizedQuery || [entry.description, entry.category?.name ?? ""]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedQuery);
      const matchesCategory = categoryFilter === "all" || entry.category?.id === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [categoryFilter, entries, query]);

  return (
    <section className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-800/90 bg-[#0a111d]/90 shadow-[0_20px_70px_rgba(2,6,23,0.3)]">
      <div className="border-b border-slate-800/90 px-5 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-2xl font-semibold text-slate-100">Extrato da fatura</h2>
              <Badge variant="outline" className="border-slate-700 text-slate-400">{entries.length}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">Compras, parcelas e ajustes lançados no ciclo selecionado.</p>
          </div>
          <div className="flex rounded-xl border border-slate-800 bg-slate-950/50 p-1">
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
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busque por uma transação"
                className="h-10 rounded-xl border-slate-800 bg-slate-950/50 pl-9 text-sm placeholder:text-slate-600"
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
        <div className="divide-y divide-slate-800/80">
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

function ViewToggle({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
        active ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function CreditCardTransactionRow({
  accountId,
  categories,
  month,
  entry,
}: {
  accountId: string;
  categories: CreditCardTransactionsPanelProps["categories"];
  month: string;
  entry: CreditCardTransactionsPanelProps["entries"][number];
}) {
  const isAdjustment = entry.kind === "adjustment" || entry.amountCents < 0;
  const actionCharge = entry.chargeId && entry.totalAmountCents
    ? {
        id: entry.chargeId,
        accountId,
        categoryId: entry.category?.id ?? "",
        description: entry.description,
        notes: entry.notes,
        purchaseDate: entry.purchaseDate,
        totalAmountCents: entry.totalAmountCents,
        installmentCount: entry.installmentCount ?? 1,
        kind: entry.kind,
      }
    : null;

  return (
    <article className="group flex gap-3 px-5 py-4 transition-colors hover:bg-slate-900/45 sm:px-6">
      <div className="w-12 shrink-0 pt-0.5 text-center">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-600">
          {formatCreditCardMonth(entry.purchaseDate.slice(0, 7)).split(" ")[0]}
        </p>
        <p className="mt-0.5 text-xl font-semibold leading-none text-slate-300">
          {entry.purchaseDate.slice(8, 10)}
        </p>
      </div>
      <div className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", isAdjustment ? "bg-emerald-400/10 text-emerald-300" : "bg-sky-400/10 text-sky-300")}>
        {isAdjustment ? <ArrowDownUp className="size-4" /> : <Tag className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-slate-100">{entry.description}</p>
          {entry.installmentNumber && entry.installmentCount ? (
            <Badge variant="outline" className="border-slate-700 text-[0.68rem] text-slate-500">
              {entry.installmentNumber}/{entry.installmentCount}
            </Badge>
          ) : null}
          {isAdjustment ? (
            <Badge variant="outline" className="border-emerald-400/30 text-[0.68rem] text-emerald-300">
              Ajuste
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-slate-500">{entry.category?.name ?? "Sem categoria"}</p>
      </div>
      <div className="flex shrink-0 items-start gap-1 sm:items-center">
        <p className={cn("pt-1 text-right text-sm font-semibold", isAdjustment ? "text-emerald-300" : "text-sky-200")}>
          {formatCurrency(entry.amountCents)}
        </p>
        {actionCharge ? (
          <CreditCardChargeActions
            accountId={accountId}
            categories={categories}
            month={month}
            charge={actionCharge}
          />
        ) : (
          <MoreHorizontal className="mt-1 hidden size-4 text-slate-700 sm:block" />
        )}
      </div>
    </article>
  );
}

function CategoryBreakdown({
  categoryTotals,
}: {
  categoryTotals: CreditCardTransactionsPanelProps["categoryTotals"];
}) {
  const largest = Math.max(...categoryTotals.map((category) => Math.abs(category.amountCents)), 1);

  if (!categoryTotals.length) {
    return <TransactionEmptyState query="" />;
  }

  return (
    <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
      {categoryTotals.map((category) => (
        <div key={category.categoryId} className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-100">{category.categoryName}</p>
              <p className="mt-1 text-xs text-slate-500">{category.group === "fixed_expense" ? "Gasto fixo" : "Gasto variável"}</p>
            </div>
            <p className="shrink-0 font-semibold text-sky-200">{formatCurrency(category.amountCents)}</p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-300" style={{ width: `${Math.max((Math.abs(category.amountCents) / largest) * 100, 4)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionEmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-600">
        <Search className="size-5" />
      </div>
      <p className="mt-4 font-medium text-slate-200">{query ? "Nenhum resultado encontrado" : "Nenhum lançamento nesta fatura"}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {query ? "Tente buscar por outro nome ou remova o filtro de categoria." : "Quando houver compras ou parcelas no mês selecionado, elas aparecerão aqui."}
      </p>
    </div>
  );
}
