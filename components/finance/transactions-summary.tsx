"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { TransactionsFlowBar } from "@/components/finance/transactions-flow-bar";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { TransactionsSummaryProps } from "@/lib/interfaces/transactions";
import { buildTransactionsFlow } from "@/lib/transactions-summary";
import { cn } from "@/lib/utils";

export function TransactionsSummary({ month, totals }: TransactionsSummaryProps) {
  const { formatCurrency } = useFinancialFormatter();
  const result = totals.income - totals.expense;
  const segments = buildTransactionsFlow(totals);
  return (
    <section aria-label="Resultado do período" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/transactions-card-cash.webp" className="top-4 right-6 size-[96px]" />
      <h2 className="text-sm font-semibold text-content-strong">Resultado do período</h2>
      <DashboardCardsMoney cents={result} className={cn("mt-4 block text-[48px] leading-[52px] font-bold", result < 0 ? "text-destructive" : "text-content-strong")} />
      <p className="mt-2 pr-24 text-xs text-content">{`Receitas menos despesas de ${formatMonthLabel(month)}, sem lançamentos cancelados.`}</p>
      <TransactionsFlowBar segments={segments} />
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {segments.map((segment) => (
          <div key={segment.key}>
            <dt className="flex items-center gap-1.5 text-xs text-content">
              <span aria-hidden className={cn("size-2 shrink-0 rounded-full", segment.colorClassName)} />
              {segment.label}
            </dt>
            <dd className="mt-1 text-[15px] font-semibold text-content-strong">{formatCurrency(segment.amountCents)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
