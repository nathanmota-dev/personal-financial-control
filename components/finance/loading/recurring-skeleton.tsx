import { LoadingHero, LoadingPage, LoadingPanel, LoadingRows, LoadingTabs } from "@/components/finance/loading/primitives";

export function RecurringSkeleton() {
  return <LoadingPage label="recorrências" actions={3}>
    <LoadingHero />
    <LoadingTabs count={3} />
    <LoadingPanel><LoadingRows count={4} columns={4} /></LoadingPanel>
    <LoadingPanel><LoadingRows count={2} columns={4} /></LoadingPanel>
  </LoadingPage>;
}
