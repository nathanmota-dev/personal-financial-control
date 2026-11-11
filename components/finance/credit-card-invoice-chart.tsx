"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { invoiceTileLabel } from "@/lib/dashboard-cards";
import type { CreditCardInvoiceChartProps } from "@/lib/interfaces/dashboard-cards";
import { cn } from "@/lib/utils";

const GAP = 2.5;

export function CreditCardInvoiceChart({ invoices }: CreditCardInvoiceChartProps) {
  const { formatCurrency } = useFinancialFormatter();
  const tileWidth = (100 - GAP * (invoices.length - 1)) / invoices.length;
  const totals = invoices.map((invoice) => invoice.totalCents);
  const min = Math.min(...totals);
  const span = Math.max(Math.max(...totals) - min, 1);
  const points = invoices.map((invoice, index) => ({
    x: index * (tileWidth + GAP) + tileWidth / 2,
    height: 38 + ((invoice.totalCents - min) / span) * 22,
  }));
  return (
    <div data-testid="credit-card-invoice-chart" className="relative h-[136px]">
      <div className="grid h-full grid-cols-3" style={{ columnGap: `${GAP}%` }}>
        {invoices.map((invoice, index) => {
          const selected = index === 0;
          return (
            <div
              key={invoice.month}
              data-selected={selected}
              className={cn(
                "relative flex flex-col items-center overflow-hidden rounded-[14px] border-2 pt-3",
                selected ? "border-brand bg-card" : "border-transparent bg-muted/70",
              )}
            >
              {selected ? (
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 bg-brand/10"
                  style={{ height: `${points[index].height}%` }}
                />
              ) : null}
              <p className="relative text-xs font-semibold text-content-strong">
                {invoiceTileLabel(invoice.month, selected)}
              </p>
              {selected ? (
                <span className="relative mt-1 rounded-full bg-brand/15 px-2 py-px text-[9px] font-semibold text-brand">
                  {invoice.status === "paid" ? "Paga" : "Aberta"}
                </span>
              ) : null}
              <p
                className={cn(
                  "absolute inset-x-0 bottom-3 text-center text-[13px] font-semibold",
                  selected ? "text-brand" : "text-content",
                )}
              >
                {formatCurrency(invoice.totalCents)}
              </p>
            </div>
          );
        })}
      </div>
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full overflow-visible"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          className="text-content-subtle"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
          points={points.map((point) => `${point.x},${100 - point.height}`).join(" ")}
        />
      </svg>
      {points.map((point, index) => (
        <span
          key={invoices[index].month}
          aria-hidden
          className={cn(
            "pointer-events-none absolute size-[11px] -translate-x-1/2 translate-y-1/2 rounded-full border-2 bg-card",
            index === 0 ? "border-brand" : "border-content-subtle",
          )}
          style={{ left: `${point.x}%`, bottom: `${point.height}%` }}
        />
      ))}
    </div>
  );
}
