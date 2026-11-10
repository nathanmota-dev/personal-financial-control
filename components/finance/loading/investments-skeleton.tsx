import { LoadingBar, LoadingHero, LoadingMetrics, LoadingPage, LoadingPanel } from "@/components/finance/loading/primitives";

export function InvestmentsSkeleton() {
  return <LoadingPage label="investimentos" actions={1}>
    <LoadingHero />
    <LoadingMetrics count={2} className="md:grid-cols-2 xl:grid-cols-2" />
    <LoadingPanel>
      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-2">
        <div className="flex justify-between gap-4"><LoadingBar className="w-32" /><LoadingBar className="w-40" /></div>
        <LoadingBar className="h-2.5 w-full bg-brand/15" />
      </div>)}</div>
    </LoadingPanel>
  </LoadingPage>;
}
