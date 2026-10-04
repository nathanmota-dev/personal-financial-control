import { LoadingChart, LoadingFields, LoadingMetrics, LoadingPage, LoadingPanel } from "./primitives";

export function ReserveSkeleton() {
  return <LoadingPage label="reserva de emergência" actions={3}>
    <LoadingMetrics count={3} className="md:grid-cols-3" />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
      <LoadingPanel><LoadingFields count={4} className="sm:grid-cols-1" /></LoadingPanel><LoadingChart />
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      <LoadingPanel><LoadingMetrics count={4} className="sm:grid-cols-2 xl:grid-cols-2" /></LoadingPanel>
      <LoadingPanel><LoadingFields count={1} className="sm:grid-cols-1" /><LoadingMetrics count={1} className="md:grid-cols-1 xl:grid-cols-1" /></LoadingPanel>
    </div>
  </LoadingPage>;
}
