import { LoadingBar, LoadingMetrics, LoadingPage, LoadingPanel, LoadingRows } from "./primitives";

export function CreditCardSkeleton() {
  return <LoadingPage label="cartão de crédito" actions={2}>
    <LoadingMetrics count={4} className="sm:grid-cols-2" />
    <LoadingPanel>
      <LoadingBar className="h-[226px] w-full rounded-xl" />
      <div className="flex gap-3">
        {Array.from({ length: 6 }, (_, index) => <LoadingBar key={index} className="h-24 flex-1 rounded-2xl" />)}
      </div>
    </LoadingPanel>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <LoadingPanel><LoadingBar className="h-10 w-full rounded-lg" /><LoadingRows count={4} columns={3} /></LoadingPanel>
      <div className="space-y-6"><LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel><LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel></div>
    </div>
  </LoadingPage>;
}
