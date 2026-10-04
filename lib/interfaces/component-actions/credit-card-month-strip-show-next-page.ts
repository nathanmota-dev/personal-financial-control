
export interface CreditCardMonthStripShowNextPageContext {
  setHasNavigated: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  setPageIndex: import("react").Dispatch<import("react").SetStateAction<number>>;
  maxPageIndex: number;
  activePageIndex: number;
}
