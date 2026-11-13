import { LoadingBar, LoadingFields, LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

const gridClassName = "grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]";

export function ProjectedBalanceSkeleton() {
  return <LoadingPage label="saldo projetado" className="min-[100.0625rem]:space-y-5">
    <div className={gridClassName}>
      <LoadingPanel><LoadingBar className="h-12 w-56" /><LoadingRows count={1} columns={4} /></LoadingPanel>
      <LoadingPanel><LoadingBar className="h-10 w-44" /><LoadingRows count={2} columns={2} /></LoadingPanel>
    </div>
    <div className={gridClassName}>
      <LoadingPanel><LoadingBar className="h-[320px] w-full rounded-xl bg-surface-raised min-[100.0625rem]:h-[280px]" /></LoadingPanel>
      <LoadingPanel><LoadingFields count={4} className="sm:grid-cols-1" /><LoadingRows count={3} columns={2} /></LoadingPanel>
    </div>
    <LoadingPanel>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">{Array.from({ length: 35 }, (_, index) => <LoadingBar key={index} className="h-16 w-full rounded-xl sm:h-24" />)}</div>
    </LoadingPanel>
  </LoadingPage>;
}
