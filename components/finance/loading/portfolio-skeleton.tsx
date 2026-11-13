import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows } from "./primitives";

export function PortfolioSkeleton() {
  return <LoadingPage label="carteira" actions={2} className="min-[100.0625rem]:space-y-5">
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel><LoadingBar className="h-12 w-56" /><LoadingRows count={1} columns={4} /></LoadingPanel>
      <LoadingPanel>{Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-2"><div className="flex justify-between gap-4"><LoadingBar className="w-28" /><LoadingBar className="w-24" /></div><LoadingBar className="h-[9px] w-full" /></div>)}</LoadingPanel>
    </div>
    <LoadingPanel>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]"><LoadingBar className="h-10 w-full rounded-[10px]" /><LoadingBar className="h-10 w-full rounded-[10px]" /></div>
      <LoadingRows count={6} columns={5} />
    </LoadingPanel>
  </LoadingPage>;
}
