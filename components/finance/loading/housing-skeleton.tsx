import { LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

export function HousingSkeleton() {
  return <LoadingPage label="casa" actions={3}>
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel>
      <LoadingPanel><LoadingRows count={4} columns={3} /></LoadingPanel>
    </div>
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel><LoadingRows count={4} columns={4} /></LoadingPanel>
      <LoadingPanel><LoadingRows count={4} columns={3} /></LoadingPanel>
    </div>
  </LoadingPage>;
}
