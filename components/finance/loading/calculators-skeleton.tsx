import { LoadingBar, LoadingPage, LoadingPanel } from "./primitives";

export function CalculatorsSkeleton() {
  return <LoadingPage label="calculadoras financeiras">
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <LoadingPanel><LoadingBar className="size-12 rounded-xl" /><LoadingBar className="h-16 w-full rounded-lg" /><LoadingBar className="h-9 w-36" /></LoadingPanel>
    </div>
  </LoadingPage>;
}
