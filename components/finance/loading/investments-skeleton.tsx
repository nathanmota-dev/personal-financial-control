import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows } from "@/components/finance/loading/primitives";

const gridClassName = "grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]";

export function InvestmentsSkeleton() {
  return <LoadingPage label="investimentos" actions={1} className="min-[100.0625rem]:space-y-5">
    <div className={gridClassName}>
      <LoadingPanel><LoadingBar className="h-12 w-56" /><LoadingBar className="h-6 w-full rounded-md" /><LoadingRows count={1} columns={4} /></LoadingPanel>
      <LoadingPanel>{Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-2"><div className="flex justify-between gap-4"><LoadingBar className="w-28" /><LoadingBar className="w-24" /></div><LoadingBar className="h-[9px] w-full" /></div>)}</LoadingPanel>
    </div>
    <LoadingPanel><div className="flex justify-between gap-4"><LoadingBar className="h-6 w-52" /><LoadingBar className="h-8 w-36 rounded-[10px]" /></div><LoadingRows count={1} columns={4} /><LoadingBar className="h-[340px] w-full rounded-xl min-[100.0625rem]:h-[300px]" /></LoadingPanel>
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-2">
      {Array.from({ length: 2 }, (_, index) => <LoadingPanel key={index}><LoadingBar className="h-6 w-44" /><LoadingRows count={1} columns={3} /><LoadingBar className="h-[260px] w-full rounded-xl" /></LoadingPanel>)}
    </div>
    <div className="grid gap-6 min-[100.0625rem]:gap-5 md:grid-cols-2">
      {Array.from({ length: 2 }, (_, index) => <LoadingPanel key={index}><LoadingBar className="h-10 w-44" /><LoadingBar className="h-7 w-32 rounded-lg" /></LoadingPanel>)}
    </div>
  </LoadingPage>;
}
