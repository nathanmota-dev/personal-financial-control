import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

export default function BudgetsLoading() {
  return <LoadingPage label="orçamentos" actions={3}>
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel><LoadingBar className="h-12 w-56" /><LoadingBar className="h-2.5 w-full" /><LoadingRows count={1} columns={4} /></LoadingPanel>
      <LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel>
    </div>
    <LoadingPanel><LoadingRows count={3} columns={3} /></LoadingPanel>
    <LoadingPanel><LoadingRows count={3} columns={3} /></LoadingPanel>
  </LoadingPage>;
}
