import { LoadingPage, LoadingPanel, LoadingRows } from "./primitives";

/** Fallback for finance routes without a dedicated skeleton. */
export function FinanceSkeleton() {
  return <LoadingPage label="dados financeiros"><LoadingPanel><LoadingRows count={3} /></LoadingPanel></LoadingPage>;
}
