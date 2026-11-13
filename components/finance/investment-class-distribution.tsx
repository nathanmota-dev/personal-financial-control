"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { dashboardCategoryColors as colors } from "@/lib/dashboard-categories";
import { toPercent } from "@/lib/finance-tone";
import { investmentAssetClassLabels } from "@/lib/finance-ui";
import type { InvestmentClassDistributionProps } from "@/lib/interfaces/investment-operations";

export function InvestmentClassDistribution({ title, description, items, emptyMessage, illustrationSrc }: InvestmentClassDistributionProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const totalCents = items.reduce((sum, item) => sum + item.amountCents, 0);
  return (
    <section className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src={illustrationSrc} />
      <h2 className="text-lg font-semibold leading-[25px]">{title}</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">{description}</p>
      {items.length ? (
        <ul className="mt-6 space-y-5">
          {items.map((item, index) => {
            const percent = toPercent(item.amountCents, totalCents);
            const color = colors[index % colors.length];
            return (
              <li key={item.assetClass} className="text-xs">
                <div className="flex items-center gap-2">
                  <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="min-w-0 flex-1 truncate font-medium text-content">{investmentAssetClassLabels[item.assetClass]}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-content-strong">{formatCurrency(item.amountCents)}</span>
                  <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-content-subtle">{hidden ? "—" : `${percent.toFixed(1).replace(".", ",")}%`}</span>
                </div>
                <div aria-hidden className="mt-2 h-[9px] overflow-hidden rounded-full bg-[var(--chart-rail)]">
                  <div className="h-full rounded-full" style={{ width: hidden ? 0 : `${percent}%`, backgroundColor: color }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 text-center text-sm text-content-muted">{emptyMessage}</p>
      )}
    </section>
  );
}
