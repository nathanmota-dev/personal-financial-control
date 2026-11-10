import { LoadingHero, LoadingMetrics, LoadingPage, LoadingPanel } from "@/components/finance/loading/primitives";

export default function BudgetsLoading() {
  return <LoadingPage label="orçamentos" actions={3}>
    <LoadingHero />
    <LoadingPanel><LoadingMetrics count={3} className="md:grid-cols-2 xl:grid-cols-3" /></LoadingPanel>
    <LoadingPanel><LoadingMetrics count={3} className="md:grid-cols-2 xl:grid-cols-3" /></LoadingPanel>
  </LoadingPage>;
}
