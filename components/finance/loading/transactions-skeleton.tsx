import { LoadingBar, LoadingFields, LoadingHero, LoadingPage, LoadingPanel, LoadingRows, LoadingTabs } from "@/components/finance/loading/primitives";

export function TransactionsSkeleton() {
  return <LoadingPage label="lançamentos" actions={3}>
    <LoadingHero />
    <LoadingTabs count={2} />
    <div className="rounded-[20px] border border-border bg-card p-2.5"><LoadingFields count={5} className="xl:grid-cols-5" /></div>
    <LoadingPanel><LoadingBar className="h-11 w-full rounded-xl bg-surface-raised" /><LoadingRows count={6} columns={5} /></LoadingPanel>
  </LoadingPage>;
}
