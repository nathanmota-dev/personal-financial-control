import { LoadingBar, LoadingMetrics, LoadingPage, LoadingPanel } from "./primitives";

export function InvestmentsSkeleton() {
  return <LoadingPage label="investimentos" actions={1}>
    <LoadingMetrics count={4} />
    <LoadingPanel>
      <div className="space-y-4">{Array.from({ length: 5 }, (_, index) => <div key={index} className="space-y-2">
        <div className="flex justify-between gap-4"><LoadingBar className="w-32" /><LoadingBar className="w-40" /></div>
        <LoadingBar className="h-2 w-full bg-brand/15" />
      </div>)}</div>
    </LoadingPanel>
  </LoadingPage>;
}
