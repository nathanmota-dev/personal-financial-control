import { LoadingBar, LoadingChart, LoadingFields, LoadingHero, LoadingPage, LoadingPanel, LoadingTabs } from "@/components/finance/loading/primitives";

export function ProjectedBalanceSkeleton() {
  return <LoadingPage label="saldo projetado">
    <LoadingHero />
    <LoadingChart />
    <LoadingPanel><LoadingFields count={4} className="xl:grid-cols-4" /></LoadingPanel>
    <LoadingTabs count={2} />
    <LoadingPanel>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">{Array.from({ length: 35 }, (_, index) => <LoadingBar key={index} className="h-16 w-full rounded-2xl sm:h-24" />)}</div>
    </LoadingPanel>
  </LoadingPage>;
}
