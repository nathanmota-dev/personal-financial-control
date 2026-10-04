import type { CreditCardMonthStripShowNextPageContext } from "@/lib/interfaces/component-actions/credit-card-month-strip-show-next-page";

export function CreditCardMonthStripShowNextPage({ setHasNavigated, setPageIndex, maxPageIndex, activePageIndex }: CreditCardMonthStripShowNextPageContext) {
    setHasNavigated(true);
    setPageIndex(Math.min(maxPageIndex, activePageIndex + 1));
  }
