import { LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

export function HousingSkeleton() {
  return <LoadingPage label="casa" actions={3}>
    <div className="grid gap-6 xl:grid-cols-2">
      <LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel>
      <LoadingPanel><LoadingRows count={4} columns={3} /></LoadingPanel>
    </div>
    <LoadingPanel><LoadingRows count={4} columns={4} /></LoadingPanel>
  </LoadingPage>;
}
