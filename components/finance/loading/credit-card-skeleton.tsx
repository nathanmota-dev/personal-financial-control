import { LoadingBar, LoadingPage, LoadingPanel, LoadingRows } from "./primitives";

export function CreditCardSkeleton() {
  return <LoadingPage label="cartões" actions={2}>
    <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
      <LoadingPanel>
        <LoadingBar className="h-12 w-56" />
        <LoadingBar className="h-[236px] w-full max-w-[420px] rounded-[14px]" />
        <LoadingBar className="h-[136px] w-full rounded-[14px]" />
      </LoadingPanel>
      <div className="grid content-start gap-6 min-[100.0625rem]:gap-5">
        <LoadingPanel><LoadingRows count={4} columns={2} /></LoadingPanel>
        <LoadingPanel><LoadingRows count={3} columns={2} /></LoadingPanel>
      </div>
    </div>
    <LoadingPanel>
      <LoadingBar className="h-[226px] w-full rounded-xl" />
      <div className="flex gap-3">
        {Array.from({ length: 6 }, (_, index) => <LoadingBar key={index} className="h-24 flex-1 rounded-[14px]" />)}
      </div>
    </LoadingPanel>
    <LoadingPanel><LoadingBar className="h-10 w-full rounded-lg" /><LoadingRows count={4} columns={3} /></LoadingPanel>
  </LoadingPage>;
}
