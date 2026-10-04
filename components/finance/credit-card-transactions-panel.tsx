"use client";

import type { TransactionView } from "@/lib/interfaces/components/credit-card-transactions-panel";
import { useMemo,useState } from "react";
import { CreditCardTransactionsPanelSection1 } from "./credit-card-transactions-panel-credit-card-transactions-panel-section1";

import type { CreditCardTransactionsPanelProps } from "@/lib/interfaces/credit-card-view";

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
    <CreditCardTransactionsPanelSection1 entries={entries} view={view} setView={setView} query={query} setQuery={setQuery} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} categories={categories} filteredEntries={filteredEntries} accountId={accountId} month={month} categoryTotals={categoryTotals} />
  );
}
