import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows } from "./primitives";

export function CalculatorsSkeleton() {
  return <LoadingPage label="calculadoras financeiras" className="min-[100.0625rem]:space-y-5">
    <div className="grid gap-6 min-[100.0625rem]:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => <LoadingPanel key={index}><LoadingRows count={3} columns={1} /><LoadingBar className="h-8 w-36 rounded-lg" /></LoadingPanel>)}
    </div>
  </LoadingPage>;
}
