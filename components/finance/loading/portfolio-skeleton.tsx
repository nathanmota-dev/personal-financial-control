import { LoadingFields, LoadingPage, LoadingRows, LoadingBar } from "./primitives";

export function PortfolioSkeleton() {
  return <LoadingPage label="carteira de longo prazo" actions={2}>
    <div className="overflow-hidden rounded-[20px] border border-border bg-card">
      <div className="grid items-center gap-4 border-b border-border p-5 md:grid-cols-[1fr_220px_auto]">
        <LoadingBar className="h-10 w-full rounded-xl" /><LoadingFields count={1} className="sm:grid-cols-1" /><LoadingBar className="h-14 w-32 rounded-xl" />
      </div>
      <LoadingRows count={6} columns={5} className="px-5" />
    </div>
  </LoadingPage>;
}
