import { LoadingBar, LoadingFields, LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

export function TransactionsSkeleton() {
  return <LoadingPage label="lançamentos" actions={3}>
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel><LoadingBar className="h-12 w-56" /><LoadingBar className="h-2.5 w-full" /><LoadingRows count={1} columns={4} /></LoadingPanel>
      <LoadingPanel><LoadingRows count={4} columns={2} /></LoadingPanel>
    </div>
    <LoadingPanel>
      <LoadingFields count={5} className="xl:grid-cols-5" />
      <LoadingBar className="h-10 w-full rounded-xl bg-surface-raised" />
      <LoadingRows count={6} columns={5} />
    </LoadingPanel>
  </LoadingPage>;
}
