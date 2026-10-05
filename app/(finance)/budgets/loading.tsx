import { LoadingMetrics, LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

export default function BudgetsLoading() {
  return <LoadingPage label="orçamentos" actions={3}>
    <LoadingMetrics count={5} className="xl:grid-cols-5" />
    <div className="grid gap-6 xl:grid-cols-2"><LoadingPanel><LoadingRows count={3} /></LoadingPanel><LoadingPanel><LoadingRows count={2} columns={1} /></LoadingPanel></div>
    <LoadingPanel><div className="grid gap-8 md:grid-cols-2"><LoadingRows count={3} /><LoadingRows count={3} /></div></LoadingPanel>
  </LoadingPage>;
}
