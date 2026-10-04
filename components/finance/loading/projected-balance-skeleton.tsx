import { LoadingBar, LoadingChart, LoadingFields, LoadingMetrics, LoadingPage, LoadingPanel, LoadingTabs } from "./primitives";

export function ProjectedBalanceSkeleton() {
  return <LoadingPage label="saldo projetado">
    <LoadingMetrics count={5} className="xl:grid-cols-5" />
    <LoadingPanel><LoadingFields count={6} className="xl:grid-cols-3" /></LoadingPanel>
    <LoadingChart />
    <LoadingTabs count={2} />
    <LoadingPanel>
      <div className="grid grid-cols-7 gap-1 sm:gap-3">{Array.from({ length: 35 }, (_, index) => <LoadingBar key={index} className="h-16 w-full rounded-lg sm:h-24" />)}</div>
    </LoadingPanel>
  </LoadingPage>;
}
