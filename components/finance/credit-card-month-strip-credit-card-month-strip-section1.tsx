"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { CreditCardInvoiceLine } from "@/components/finance/credit-card-invoice-line";
import { CreditCardInvoiceTile } from "@/components/finance/credit-card-invoice-tile";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { Button } from "@/components/ui/button";
import { buildCreditCardTimeline } from "@/lib/credit-card-timeline";
import { getDefaultMonth } from "@/lib/finance-ui";
import type { CreditCardMonthStripSection1Props } from "@/lib/interfaces/render/credit-card-month-strip-credit-card-month-strip-section1";
import { cn } from "@/lib/utils";

export function CreditCardMonthStripSection1({ isLoading, visiblePoints, activePageIndex, showPreviousPage, cardsViewportRef, pageStart, points, selectedMonth, onSelectMonth, maxPageIndex, showNextPage }: CreditCardMonthStripSection1Props) {
  const nodes = buildCreditCardTimeline(visiblePoints, points[pageStart - 1]?.totalCents, getDefaultMonth());
  return (
    <section className="relative rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6" aria-busy={isLoading}>
      <DashboardCardIllustration src="/images/projected-balance-trend.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Suas faturas</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Evolução mensal e seleção do período</p>

      <div className="mt-5 flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 rounded-full" aria-label="Mostrar faturas anteriores" disabled={activePageIndex === 0} onClick={showPreviousPage}>
          <ChevronLeft />
        </Button>
        <div
          ref={cardsViewportRef}
          className={cn("relative min-w-0 flex-1 rounded-[18px] bg-surface p-1.5 transition-opacity", isLoading && "opacity-60")}
          aria-label={`Faturas ${pageStart + 1} a ${Math.min(pageStart + visiblePoints.length, points.length)}`}
        >
          <div className="relative">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(nodes.length, 1)}, minmax(0, 1fr))` }}>
              {nodes.map((node) => (
                <div key={node.point.month} className="p-1">
                  <CreditCardInvoiceTile node={node} selected={node.point.month === selectedMonth} onSelect={() => onSelectMonth(node.point.month)} />
                </div>
              ))}
            </div>
            <CreditCardInvoiceLine nodes={nodes} />
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 rounded-full" aria-label="Mostrar próximas faturas" disabled={activePageIndex >= maxPageIndex} onClick={showNextPage}>
          <ChevronRight />
        </Button>
      </div>
    </section>
  );
}
