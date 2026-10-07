"use client";

import { Banknote, Clock3, Percent, Wallet } from "lucide-react";
import { FinanceMetric } from "@/components/finance/finance-metric";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { MonthlyRetrospectiveProps } from "@/lib/interfaces/monthly-retrospective";

export function MonthlySummaryMetrics({ summary }: MonthlyRetrospectiveProps) {
  const { formatCurrency } = useFinancialFormatter();
  const { totals, pending } = summary;
  return <section aria-label="Números do mês" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <FinanceMetric label="Resultado antes dos investimentos" value={formatCurrency(totals.operatingResultCents)} icon={<Wallet />} description={<>Receitas: {formatCurrency(totals.incomeCents)}; despesas líquidas: {formatCurrency(totals.expenseCents)}</>} />
    <FinanceMetric label="Taxa de economia" value={totals.savingsRate === null ? "Não aplicável" : `${totals.savingsRate.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`} icon={<Percent />} description={totals.savingsRate === null ? "Taxa de economia exige receitas positivas." : "Resultado antes dos investimentos / receitas"} />
    <FinanceMetric label="Saldo livre" value={formatCurrency(totals.netResultCents)} icon={<Banknote />} description={<>Após aportes e resgates: {formatCurrency(totals.netInvestmentFlowCents)} líquidos</>} />
    <FinanceMetric label="Pendências do mês" value={formatCurrency(pending.amountCents)} icon={<Clock3 />} description={`${pending.count} lançamentos pendentes (incluindo créditos)`} tone={pending.count ? "warning" : "neutral"} />
  </section>;
}
