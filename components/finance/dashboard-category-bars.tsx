"use client";

import { cn } from "@/lib/utils";
import type { DashboardCategorySectionProps } from "@/lib/interfaces/dashboard";
import { dashboardCategoryColors as colors } from "@/lib/dashboard-categories";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";

export function DashboardCategoryBars({ distribution, size = "default" }: DashboardCategorySectionProps) {
  const { formatCurrency } = useFinancialFormatter();
  const { positive, credits } = distribution;
  const max = positive[0]?.amountCents ?? 1;
  return (
    <section className={cn("min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6", size === "expanded" ? "min-h-[420px]" : "xl:h-[340px] min-[100.0625rem]:h-[290px]")}>
      <h2 className="text-lg font-semibold leading-[25px]">Gastos por categoria</h2>
      <p className="mt-1 text-xs text-content-muted">Peso relativo das despesas no mês</p>
      <div className={size === "expanded" ? "mt-8" : "mt-[27px] max-h-[235px] min-[100.0625rem]:mt-5 min-[100.0625rem]:max-h-[190px] overflow-y-auto"}>
        <div className="grid gap-[28px] min-[100.0625rem]:gap-5">
          {(size === "expanded" ? positive : positive.slice(0, 5)).map((item, index) => (
            <div key={item.categoryId} className="grid grid-cols-[87px_minmax(0,1fr)_76px] items-center gap-3 text-xs">
              <span className="truncate font-medium text-content" title={item.categoryName}>{item.categoryName}</span>
              <svg className="h-[9px] w-full overflow-visible" viewBox="0 0 198 9" preserveAspectRatio="none" role="img" aria-label={`${item.categoryName}: ${formatCurrency(item.amountCents)}`}>
                <rect width="198" height="9" rx="4.5" fill="var(--chart-rail)" />
                <rect width={(item.amountCents / max) * 172.2} height="9" rx="4.5" fill={colors[index % colors.length]} />
              </svg>
              <span className="whitespace-nowrap text-right text-[11px] text-content">{formatCurrency(item.amountCents)}</span>
            </div>
          ))}
        </div>
        {!positive.length && <p className="mt-8 text-center text-sm text-content-muted">Nenhuma despesa líquida positiva neste mês.</p>}
        {credits.length > 0 && <div className="mt-5 space-y-2 border-t border-border pt-3">
          <p className="text-xs font-semibold">Categorias com créditos líquidos</p>
          {credits.map((item) => <p key={item.categoryId} className="flex justify-between gap-3 text-xs text-content"><span>{item.categoryName}</span><span>{formatCurrency(item.amountCents)}</span></p>)}
        </div>}
      </div>
    </section>
  );
}
