import type { CreditCardMonthStripShowPreviousPageContext } from "@/lib/interfaces/component-actions/credit-card-month-strip-show-previous-page";

export function CreditCardMonthStripShowPreviousPage({ setHasNavigated, setPageIndex, activePageIndex }: CreditCardMonthStripShowPreviousPageContext) {
    setHasNavigated(true);
    setPageIndex(Math.max(0, activePageIndex - 1));
  }
