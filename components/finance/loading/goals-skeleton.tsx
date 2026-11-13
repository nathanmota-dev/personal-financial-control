import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows } from "./primitives";

const gridClassName = "grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]";

export function GoalsSkeleton() {
  return <LoadingPage label="metas" actions={2} className="min-[100.0625rem]:space-y-5">
    <div className={gridClassName}>
      <LoadingPanel><LoadingBar className="h-12 w-56" /><LoadingBar className="h-2.5 w-full" /><LoadingRows count={1} columns={4} /></LoadingPanel>
      <LoadingPanel><div className="flex flex-wrap items-center gap-5"><LoadingBar className="size-[180px] rounded-full" /><div className="flex-1 space-y-3"><LoadingBar className="w-full" /><LoadingBar className="w-4/5" /><LoadingBar className="w-3/5" /></div></div></LoadingPanel>
    </div>
    <LoadingPanel>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="min-w-0 space-y-4 rounded-[14px] border border-border p-4">
          <LoadingBar className="h-6 w-32" /><LoadingBar className="h-7 w-40" /><LoadingBar className="h-2.5 w-full" />
          <LoadingRows count={1} columns={2} />
          <LoadingBar className="h-8 w-3/4 rounded-lg" />
        </div>)}
      </div>
    </LoadingPanel>
    <div className={gridClassName}>
      <LoadingPanel><LoadingBar className="h-[280px] w-full rounded-xl bg-surface-raised" /></LoadingPanel>
      <LoadingPanel><LoadingRows count={4} columns={2} /></LoadingPanel>
    </div>
  </LoadingPage>;
}
