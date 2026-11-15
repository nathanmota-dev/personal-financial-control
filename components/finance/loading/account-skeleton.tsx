import { LoadingBar, LoadingFields, LoadingPage, LoadingPanel, LoadingRows } from "./primitives";

export function AccountSkeleton() {
  return <LoadingPage label="dados da conta" className="min-[100.0625rem]:space-y-5">
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel><LoadingFields count={3} className="gap-5" /><LoadingBar className="h-10 w-40 rounded-[10px]" /></LoadingPanel>
      <LoadingPanel><LoadingBar className="h-16 w-full rounded-[14px]" /><LoadingRows count={2} columns={2} /></LoadingPanel>
    </div>
  </LoadingPage>;
}
