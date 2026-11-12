"use client";

import { DateGroupLabel } from "@/components/finance/ds/date-group-label";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { TransactionListRow } from "@/components/finance/transaction-list-row";
import { Input } from "@/components/ui/input";
import { groupByDate } from "@/lib/finance-tone";
import type { TransactionListProps } from "@/lib/interfaces/transactions";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export function TransactionList({ transactions, ...rowProps }: TransactionListProps) {
  const { formatCurrency } = useFinancialFormatter();
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    const visible = term
      ? transactions.filter((item) => [item.description, item.notes, item.category?.name, item.account?.name].some((text) => text?.toLowerCase().includes(term)))
      : transactions;
    return groupByDate(visible, (item) => item.transactionDate);
  }, [query, transactions]);

  return (
    <div className="pb-3">
      <label className="relative mx-[22px] mt-5 block">
        <span className="sr-only">Buscar lançamentos</span>
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-content-muted" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por descrição, categoria ou conta" className="h-10 rounded-xl border-border bg-muted/30 pl-10 text-sm" />
      </label>
      {groups.length ? (
        <div role="table" aria-label="Lançamentos do período">
          {groups.map((group) => (
            <div key={group.date} role="rowgroup">
              <div className="px-[22px] pt-5 pb-1">
                <DateGroupLabel
                  date={group.date}
                  total={formatCurrency(group.rows.reduce((sum, item) => item.status === "cancelled" ? sum : sum + (item.type === "income" || item.type === "investment_withdrawal" ? item.amountCents : -item.amountCents), 0))}
                />
              </div>
              <div className="divide-y divide-border/80">
                {group.rows.map((transaction) => <TransactionListRow key={transaction.id} transaction={transaction} {...rowProps} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mx-[22px] mt-5 rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-content">Nenhum lançamento corresponde à busca.</p>
      )}
    </div>
  );
}
