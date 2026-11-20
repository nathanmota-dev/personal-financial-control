import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

export function PredictabilitySkeleton() {
  return <LoadingPage label="previsibilidade" actions={1} className="min-[100.0625rem]:space-y-5">
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <div className="min-w-0 space-y-6 min-[100.0625rem]:space-y-5">
        <LoadingPanel><LoadingBar className="h-12 w-56" /><LoadingRows count={1} columns={4} /></LoadingPanel>
        <LoadingPanel>
          <LoadingBar className="h-8 w-48" />
          <div className="grid grid-cols-7 gap-1 sm:gap-2">{Array.from({ length: 35 }, (_, index) => <LoadingBar key={index} className="h-20 w-full rounded-xl sm:h-24" />)}</div>
        </LoadingPanel>
      </div>
      <LoadingPanel><LoadingBar className="h-6 w-40" /><LoadingRows count={4} columns={2} /><LoadingRows count={6} columns={2} /></LoadingPanel>
    </div>
  </LoadingPage>;
}
