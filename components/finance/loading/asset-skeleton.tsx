import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

export function AssetSkeleton() {
  return <LoadingPage label="detalhes do ativo" actions={3} className="min-[100.0625rem]:space-y-5">
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel><LoadingBar className="h-12 w-64" /><LoadingBar className="h-3 w-48 bg-surface-raised" /><LoadingRows count={1} columns={4} /></LoadingPanel>
      <LoadingPanel><LoadingBar className="h-10 w-44" /><LoadingBar className="h-2.5 w-full" /><LoadingRows count={3} columns={2} /></LoadingPanel>
    </div>
    <LoadingPanel><LoadingRows count={5} columns={4} /></LoadingPanel>
  </LoadingPage>;
}
