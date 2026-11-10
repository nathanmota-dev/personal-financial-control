import { LoadingHero, LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

export function AssetSkeleton() {
  return <LoadingPage label="detalhes do ativo" actions={3}>
    <LoadingHero />
    <LoadingPanel><LoadingRows count={5} columns={4} /></LoadingPanel>
  </LoadingPage>;
}
