import { LoadingBar, LoadingMetrics, LoadingPage, LoadingPanel, LoadingRows } from "./primitives";

export function CreditCardSkeleton() {
  return <LoadingPage label="cartão de crédito" actions={2} className="pb-8">
    <LoadingMetrics count={6} className="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
    <LoadingPanel>
      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div className="space-y-4"><LoadingBar className="h-14 w-64" /><LoadingBar className="w-56" /><LoadingBar className="h-10 w-40 rounded-lg" /></div>
        <div className="space-y-3"><LoadingBar className="h-28 w-full rounded-2xl" /><LoadingBar className="h-24 w-full rounded-2xl" /></div>
      </div>
    </LoadingPanel>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
      <LoadingPanel><LoadingBar className="h-10 w-full rounded-lg" /><LoadingRows count={5} columns={3} /></LoadingPanel>
      <div className="space-y-5"><LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel><LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel></div>
    </div>
  </LoadingPage>;
}
