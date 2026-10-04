import { LoadingMetrics, LoadingPage, LoadingPanel, LoadingRows } from "./primitives";

export function AssetSkeleton() {
  return <LoadingPage label="detalhes do ativo" actions={3}>
    <LoadingMetrics count={4} className="md:grid-cols-4" />
    <LoadingPanel><LoadingRows count={5} columns={4} /></LoadingPanel>
  </LoadingPage>;
}
