"use client";

import { CreditCardMonthCard } from "@/components/finance/credit-card-month-card";
import { CreditCardTimelineChart } from "@/components/finance/credit-card-timeline-chart";
import { Button } from "@/components/ui/button";
import type { CreditCardMonthStripSection1Props } from "@/lib/interfaces/render/credit-card-month-strip-credit-card-month-strip-section1";
import { CalendarDays,ChevronLeft,ChevronRight } from "lucide-react";

export function CreditCardMonthStripSection1({ isLoading, visiblePoints, activePageIndex, showPreviousPage, cardsViewportRef, pageStart, points, selectedMonth, onSelectMonth, maxPageIndex, showNextPage }: CreditCardMonthStripSection1Props) {
  return (
<section
      className="rounded-[20px] border border-border bg-card p-4 shadow-none sm:p-5"
      aria-busy={isLoading}
    >
      <div className="flex items-start justify-between gap-4 px-1">
        <div>
          <p className="text-[0.68rem] font-semibold text-content">
            Linha do tempo
          </p>
          <h2 className="mt-1 text-xl font-semibold text-content-strong">Suas faturas</h2>
        </div>
        <CalendarDays className="size-5 text-content" />
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-muted/30 px-2 py-2 sm:px-3">
        <CreditCardTimelineChart points={visiblePoints} />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Mostrar faturas anteriores"
          disabled={activePageIndex === 0}
          onClick={showPreviousPage}
          className="rounded-xl border-input bg-card text-content hover:bg-surface-elevated hover:text-content-strong"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div
          ref={cardsViewportRef}
          className="min-w-0 flex-1"
          aria-label={`Faturas ${pageStart + 1} a ${Math.min(pageStart + visiblePoints.length, points.length)}`}
        >
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.max(visiblePoints.length, 1)}, minmax(0, 1fr))` }}
          >
            {visiblePoints.map((point) => (
              <CreditCardMonthCard
                key={point.month}
                point={point}
                previousPoint={points[points.indexOf(point) - 1]}
                selected={point.month === selectedMonth}
                onSelect={() => onSelectMonth(point.month)}
              />
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Mostrar próximas faturas"
          disabled={activePageIndex >= maxPageIndex}
          onClick={showNextPage}
          className="rounded-xl border-input bg-card text-content hover:bg-surface-elevated hover:text-content-strong"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <p className="mt-3 text-center text-[0.68rem] text-content-subtle">
        Mostrando {pageStart + 1}–{Math.min(pageStart + visiblePoints.length, points.length)} de {points.length} meses
      </p>
    </section>
  );
}
