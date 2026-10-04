"use client";

import { CreditCardMonthStripShowNextPage } from "@/lib/utils/component-actions/credit-card-month-strip-show-next-page";
import { CreditCardMonthStripShowPreviousPage } from "@/lib/utils/component-actions/credit-card-month-strip-show-previous-page";
import { CARD_GAP,CARD_MIN_WIDTH } from "@/lib/utils/components/credit-card-month-strip";
import { useEffect,useRef,useState } from "react";
import { CreditCardMonthStripSection1 } from "./credit-card-month-strip-credit-card-month-strip-section1";

import type {
CreditCardMonthStripProps
} from "@/lib/interfaces/credit-card-view";

export function CreditCardMonthStrip({
  points,
  selectedMonth,
  onSelectMonth,
  isLoading,
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
    return CreditCardMonthStripShowPreviousPage({ setHasNavigated, setPageIndex, activePageIndex });
  }

  function showNextPage() {
    return CreditCardMonthStripShowNextPage({ setHasNavigated, setPageIndex, maxPageIndex, activePageIndex });
  }

  return (
    <CreditCardMonthStripSection1 isLoading={isLoading} visiblePoints={visiblePoints} activePageIndex={activePageIndex} showPreviousPage={showPreviousPage} cardsViewportRef={cardsViewportRef} pageStart={pageStart} points={points} selectedMonth={selectedMonth} onSelectMonth={onSelectMonth} maxPageIndex={maxPageIndex} showNextPage={showNextPage} />
  );
}
