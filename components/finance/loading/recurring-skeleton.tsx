import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows, LoadingTabs } from "@/components/finance/loading/primitives";

export function RecurringSkeleton() {
  return <LoadingPage label="recorrências" actions={4} className="min-[100.0625rem]:space-y-5">
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel><LoadingBar className="h-12 w-56" /><LoadingBar className="h-2.5 w-full" /><LoadingRows count={1} columns={4} /></LoadingPanel>
      <LoadingPanel><LoadingRows count={4} columns={2} /></LoadingPanel>
    </div>
    <LoadingTabs count={3} />
    <LoadingPanel><LoadingRows count={4} columns={4} /></LoadingPanel>
    <LoadingPanel><LoadingRows count={2} columns={4} /></LoadingPanel>
  </LoadingPage>;
}
