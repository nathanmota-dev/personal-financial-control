"use client";

import { ArrowUpRight, PiggyBank, Scale, TrendingDown, TrendingUp } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { ReportInitialProps } from "@/lib/interfaces/reports";
import { summarizeReportSeries } from "@/lib/report-overview";
import { cn } from "@/lib/utils";

export function ReportOverview({ report }: ReportInitialProps) {
  const { formatCurrency, protectText } = useFinancialFormatter();
  const totals = summarizeReportSeries(report.series);
  const periodLabel = report.mode === "monthly" ? formatMonthLabel(report.period) : report.period;
  const stats = [
    { label: "Receitas", value: formatCurrency(totals.incomeCents), icon: TrendingUp },
    { label: "Despesas", value: formatCurrency(totals.expenseCents), icon: TrendingDown },
    { label: "Investimentos líquidos", value: formatCurrency(totals.netInvestmentFlowCents), icon: ArrowUpRight },
    { label: "Saldo livre", value: formatCurrency(totals.netResultCents), icon: Scale, className: totals.netResultCents < 0 ? "text-destructive" : "text-success" },
    { label: "Taxa de economia", value: totals.savingsRate === null ? "Não aplicável" : protectText(`${totals.savingsRate.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`), icon: PiggyBank },
  ];
  return (
    <section aria-label="Resultado antes dos investimentos" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/reports-growth-bars.webp" className="top-4 right-6 size-[96px]" />
      <h2 className="text-sm font-semibold text-content-strong">Resultado antes dos investimentos</h2>
      <DashboardCardsMoney
        cents={totals.operatingResultCents}
        className={cn("mt-4 block text-[48px] leading-[52px] font-bold", totals.operatingResultCents < 0 ? "text-destructive" : "text-content-strong")}
      />
      <p className="mt-2 pr-24 text-xs text-content">
        {`Receitas menos despesas por competência em ${periodLabel}${report.partial ? " (período em andamento)" : ""}.`}
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-3 @2xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-content"><stat.icon aria-hidden className="size-3.5 shrink-0" />{stat.label}</dt>
            <dd className={cn("mt-1 text-[15px] font-semibold text-content-strong", stat.className)}>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
