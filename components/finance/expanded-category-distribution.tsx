"use client";

import type { DashboardCategorySectionProps } from "@/lib/interfaces/dashboard";
import { dashboardCategoryColors as colors } from "@/lib/dashboard-categories";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { HiddenFinancialValue } from "@/components/finance/privacy/hidden-financial-value";

export function ExpandedCategoryDistribution({ distribution }: DashboardCategorySectionProps) {
  const { formatCurrency, formatCurrencyText, hidden } = useFinancialFormatter();
  const { chart, positiveTotalCents: total, netTotalCents } = distribution;
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const slices = chart.map((item, index) => {
    const fraction = item.amountCents / total;
    const start = chart.slice(0, index).reduce((sum, entry) => sum + entry.amountCents, 0) / total;
    const angle = (start + fraction / 2) * Math.PI * 2 - Math.PI / 2;
    return { ...item, fraction, start, x: Math.cos(angle), y: Math.sin(angle), color: colors[index] };
  });

  return (
    <section className="min-w-0 rounded-[20px] border border-border bg-card px-4 pt-5 pb-6 sm:px-[22px]">
      <h2 className="text-lg font-semibold">Distribuição das despesas</h2>
      <p className="mt-1 text-xs text-content-muted">Valores e percentuais sobre categorias com gasto líquido positivo</p>
      <div className="overflow-hidden">
      <svg viewBox="0 0 640 380" className="relative left-1/2 mt-5 w-[180%] max-w-none -translate-x-1/2 sm:w-full sm:max-w-[760px]" role="img" aria-label={`Distribuição das despesas. Total líquido: ${formatCurrencyText(netTotalCents)}`}>
        <circle cx="320" cy="190" r={radius} fill="none" stroke="var(--chart-rail)" strokeWidth="48" />
        {slices.map((item) => {
          const right = item.x >= 0;
          const side = slices.filter((slice) => (slice.x >= 0) === right).sort((a, b) => a.y - b.y);
          const position = side.findIndex((slice) => slice.categoryId === item.categoryId);
          const labelY = 190 + (position - (side.length - 1) / 2) * 66;
          const edgeX = right ? 475 : 165;
          return (
            <g key={item.categoryId}>
              <title>{`${item.categoryName}: ${formatCurrencyText(item.amountCents)} (${Math.round(item.fraction * 100)}%)`}</title>
              <circle cx="320" cy="190" r={radius} fill="none" stroke={item.color} strokeWidth="48" strokeDasharray={`${Math.max(0, item.fraction * circumference - (slices.length > 1 ? 3 : 0))} ${circumference}`} strokeDashoffset={-item.start * circumference} transform="rotate(-90 320 190)" />
              <g className="hidden sm:block">
                <polyline points={`${320 + item.x * 139},${190 + item.y * 139} ${320 + item.x * 150},${labelY} ${edgeX},${labelY}`} fill="none" stroke={item.color} strokeWidth="1.5" />
                <circle cx={320 + item.x * 139} cy={190 + item.y * 139} r="3" fill={item.color} />
                <text x={right ? 483 : 157} y={labelY - 9} textAnchor={right ? "start" : "end"} fill="var(--content)" fontSize="13">
                  {item.categoryName.length > 19 ? `${item.categoryName.slice(0, 18)}…` : item.categoryName}
                </text>
                {hidden ? (
                  <foreignObject x={right ? 483 : 141} y={labelY + 1} width="18" height="18">
                    <HiddenFinancialValue />
                  </foreignObject>
                ) : (
                  <text x={right ? 483 : 157} y={labelY + 12} textAnchor={right ? "start" : "end"} fill="var(--content-strong)" fontSize="15" fontWeight="600">{formatCurrency(item.amountCents)}</text>
                )}
              </g>
            </g>
          );
        })}
        <text x="320" y="181" textAnchor="middle" fill="var(--content-muted)" fontSize="14">Total líquido</text>
        {hidden ? (
          <foreignObject x="312" y="198" width="18" height="18">
            <HiddenFinancialValue />
          </foreignObject>
        ) : (
          <text x="320" y="210" textAnchor="middle" fill="var(--content-strong)" fontSize="23" fontWeight="650">{formatCurrency(netTotalCents)}</text>
        )}
      </svg>
      </div>
      {total ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {slices.map((item) => (
            <li key={item.categoryId} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span data-user-content className="min-w-0 flex-1 text-content">{item.categoryName}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(item.amountCents)}</span>
              <span className="text-content-muted">{Math.round(item.fraction * 100)}%</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-center text-sm text-content-muted">Nenhuma despesa líquida positiva neste mês.</p>}
    </section>
  );
}
