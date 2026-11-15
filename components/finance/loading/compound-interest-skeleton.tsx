import { LoadingBar, LoadingFields, LoadingPage, LoadingPanel } from "./primitives";

export function CompoundInterestSkeleton() {
  return <LoadingPage label="calculadora" actions={1} className="min-[100.0625rem]:space-y-5">
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel>
        <LoadingFields count={4} className="gap-5" />
        <div className="flex gap-3 border-t border-border pt-5"><LoadingBar className="h-10 w-36 rounded-[10px]" /><LoadingBar className="h-10 w-24 rounded-[10px]" /></div>
      </LoadingPanel>
      <LoadingPanel><LoadingBar className="h-10 w-48" /><LoadingBar className="h-2.5 w-full" /><LoadingBar className="h-[120px] w-full rounded-[20px] bg-surface-raised" /></LoadingPanel>
    </div>
  </LoadingPage>;
}
