import { LoadingFields, LoadingMetrics, LoadingPage, LoadingPanel, LoadingRows, LoadingTabs } from "./primitives";

export function TransactionsSkeleton() {
  return <LoadingPage label="lançamentos" actions={2}>
    <LoadingMetrics count={4} />
    <LoadingPanel><LoadingFields count={5} className="xl:grid-cols-5" /></LoadingPanel>
    <LoadingTabs count={2} />
    <LoadingPanel><LoadingRows count={6} columns={8} /></LoadingPanel>
  </LoadingPage>;
}
