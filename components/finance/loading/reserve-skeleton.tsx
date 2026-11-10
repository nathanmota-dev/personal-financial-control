import { LoadingChart, LoadingFields, LoadingHero, LoadingMetrics, LoadingPage, LoadingPanel } from "@/components/finance/loading/primitives";

export function ReserveSkeleton() {
  return <LoadingPage label="reserva de emergência" actions={3}>
    <LoadingHero />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <LoadingChart />
      <LoadingPanel><LoadingFields count={1} className="sm:grid-cols-1" /><LoadingMetrics count={1} className="md:grid-cols-1 xl:grid-cols-1" /></LoadingPanel>
    </div>
    <LoadingChart />
    <LoadingPanel><LoadingFields count={1} className="sm:grid-cols-1" /></LoadingPanel>
  </LoadingPage>;
}
