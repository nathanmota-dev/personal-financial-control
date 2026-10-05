export default function BudgetsLoading() {
  return <div role="status" className="space-y-4" aria-busy="true"><p className="text-content">Carregando orçamentos…</p><div className="h-36 animate-pulse rounded-xl bg-card motion-reduce:animate-none" /><div className="h-64 animate-pulse rounded-xl bg-card motion-reduce:animate-none" /></div>;
}
