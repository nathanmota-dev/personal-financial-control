import { LoadingBar, LoadingFields, LoadingPage, LoadingPanel } from "./primitives";

export function CompoundInterestSkeleton() {
  return <LoadingPage label="calculadora de juros compostos" actions={1}>
    <LoadingPanel>
      <LoadingFields count={4} className="gap-5 md:grid-cols-2" />
      <div className="flex gap-3 pt-1"><LoadingBar className="h-11 w-36 rounded-xl" /><LoadingBar className="h-11 w-24 rounded-xl" /></div>
    </LoadingPanel>
  </LoadingPage>;
}
