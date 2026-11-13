import { LoadingBar, LoadingFields, LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

const gridClassName = "grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]";

export function ReserveSkeleton() {
  return <LoadingPage label="reserva" actions={3} className="min-[100.0625rem]:space-y-5">
    <div className={gridClassName}>
      <LoadingPanel><LoadingBar className="h-12 w-56" /><LoadingRows count={1} columns={4} /></LoadingPanel>
      <LoadingPanel><LoadingRows count={4} columns={2} /><LoadingBar className="h-10 w-full rounded-[10px]" /></LoadingPanel>
    </div>
    <div className={gridClassName}>
      <LoadingPanel><LoadingRows count={1} columns={3} /><LoadingBar className="h-[280px] w-full rounded-xl bg-surface-raised" /></LoadingPanel>
      <LoadingPanel><LoadingFields count={1} className="sm:grid-cols-1" /><LoadingBar className="h-10 w-full rounded-lg" /></LoadingPanel>
    </div>
    <LoadingPanel><LoadingRows count={1} columns={3} /><LoadingRows count={3} columns={2} /></LoadingPanel>
  </LoadingPage>;
}
