import { LoadingBar, LoadingChart, LoadingMetrics, LoadingPage, LoadingPanel, LoadingRows, LoadingTabs } from "./primitives";

export function GoalsSkeleton() {
  return <LoadingPage label="metas" actions={2}>
    <LoadingMetrics count={5} className="xl:grid-cols-5" />
    <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <LoadingTabs count={2} />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => <LoadingPanel key={index}>
            <LoadingBar className="h-9 w-40" /><LoadingBar className="h-2 w-full bg-brand/15" />
            <LoadingRows count={2} columns={2} />
            <LoadingBar className="h-9 w-3/4 rounded-lg" />
          </LoadingPanel>)}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-1"><LoadingChart className="h-48" /><LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel></div>
    </div>
    <LoadingPanel><LoadingRows count={3} /></LoadingPanel>
  </LoadingPage>;
}
