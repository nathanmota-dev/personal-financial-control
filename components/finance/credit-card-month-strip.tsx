"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { CreditCardTimelineChart } from "@/components/finance/credit-card-timeline-chart";
import { Button } from "@/components/ui/button";
import { formatCreditCardMonth } from "@/lib/credit-card-view";
import { formatCurrency } from "@/lib/finance-ui";
import type {
  CreditCardMonthPoint,
  CreditCardMonthStripProps,
} from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";

const CARD_MIN_WIDTH = 132;
const CARD_GAP = 12;

export function CreditCardMonthStrip({
  points,
  selectedMonth,
  onSelectMonth,
}: CreditCardMonthStripProps) {
  const cardsViewportRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(7);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);
  const selectedIndex = points.findIndex((point) => point.month === selectedMonth);
  const selectedPageIndex = selectedIndex < 0 ? 0 : Math.floor(selectedIndex / visibleCount);
  const maxPageIndex = Math.max(0, Math.ceil(points.length / visibleCount) - 1);
  const activePageIndex = hasNavigated
    ? Math.min(pageIndex, maxPageIndex)
    : selectedPageIndex;
  const pageStart = activePageIndex * visibleCount;
  const visiblePoints = points.slice(pageStart, pageStart + visibleCount);

  useEffect(() => {
    const element = cardsViewportRef.current;
    if (!element) {
      return;
    }
    const viewport = element;

    function updateVisibleCount() {
      const width = viewport.getBoundingClientRect().width;
      const nextCount = Math.max(
        1,
        Math.floor((width + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP))
      );
      setVisibleCount(nextCount);
    }

    updateVisibleCount();
    const observer = new ResizeObserver(updateVisibleCount);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  function showPreviousPage() {
    setHasNavigated(true);
    setPageIndex(Math.max(0, activePageIndex - 1));
  }

  function showNextPage() {
    setHasNavigated(true);
    setPageIndex(Math.min(maxPageIndex, activePageIndex + 1));
  }

  return (
    <section className="rounded-[2rem] border border-border/90 bg-surface-raised/90 p-4 shadow-[0_20px_70px_rgb(var(--surface-rgb) / .3)] sm:p-5">
      <div className="flex items-start justify-between gap-4 px-1">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-content-strong0">
            Linha do tempo
          </p>
          <h2 className="mt-1 font-heading text-xl font-semibold text-content-strong">Suas faturas</h2>
        </div>
        <CalendarDays className="size-5 text-content-strong0" />
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-surface/25 px-2 py-2 sm:px-3">
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
          className="rounded-xl border-input bg-surface-raised/70 text-content hover:bg-surface-elevated hover:text-content-strong"
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
          className="rounded-xl border-input bg-surface-raised/70 text-content hover:bg-surface-elevated hover:text-content-strong"
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

function CreditCardMonthCard({
  point,
  previousPoint,
  selected,
  onSelect,
}: {
  point: CreditCardMonthPoint;
  previousPoint?: CreditCardMonthPoint;
  selected: boolean;
  onSelect: () => void;
}) {
  const isIncrease = previousPoint && point.totalCents > previousPoint.totalCents;
  const hasChange = previousPoint && point.totalCents !== previousPoint.totalCents;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "min-w-0 rounded-2xl border px-3 py-3 text-left transition-all duration-200",
        selected
          ? "border-brand/90 bg-brand/10 shadow-[0_0_24px_rgb(var(--brand-rgb) / .12)] ring-1 ring-brand/25"
          : "border-border bg-surface/30 hover:border-input hover:bg-surface-raised/70"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={cn("truncate text-sm font-medium", selected ? "text-content-strong" : "text-content")}>
          {formatCreditCardMonth(point.month)}
        </span>
        {hasChange ? (
          isIncrease ? <ArrowUpRight className="size-3.5 shrink-0 text-danger" /> : <ArrowDownRight className="size-3.5 shrink-0 text-warning" />
        ) : null}
      </div>
      <p className={cn("mt-2 truncate text-lg font-semibold", selected ? "text-brand" : "text-content")}>
        {formatCurrency(point.totalCents)}
      </p>
      <p className="mt-1 truncate text-[0.68rem] text-content-strong0">
        {point.billStatus === "paid"
          ? "Paga"
          : point.entryCount
            ? `${point.entryCount} lançamento${point.entryCount === 1 ? "" : "s"}`
            : "Sem parcelas"}
      </p>
    </button>
  );
}
