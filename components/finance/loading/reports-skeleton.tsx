import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows, LoadingTabs } from "@/components/finance/loading/primitives";

export function ReportsSkeleton() {
  return <LoadingPage label="relatórios" actions={3} className="min-[100.0625rem]:space-y-5">
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel><LoadingBar className="h-12 w-56" /><LoadingRows count={1} columns={5} /></LoadingPanel>
      <LoadingPanel><LoadingRows count={4} columns={1} /></LoadingPanel>
    </div>
    <LoadingTabs count={6} />
    <LoadingPanel><div className="grid gap-6 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="space-y-3"><LoadingBar className="w-28" /><LoadingBar className="h-7 w-36" /><LoadingBar className="h-2.5 w-full" /></div>)}</div></LoadingPanel>
    <LoadingPanel><LoadingBar className="h-64 w-full rounded-xl bg-surface-raised" /></LoadingPanel>
  </LoadingPage>;
}
