import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import type { CalculatorEmptyResultProps } from "@/lib/interfaces/compound-interest";

/** Keeps the result card on screen before the first simulation. */
export function CalculatorEmptyResult({ illustrationSrc, description }: CalculatorEmptyResultProps) {
  return (
    <section aria-label="Resultado da simulação" className="relative flex min-w-0 flex-col rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src={illustrationSrc} className="top-4 right-6 size-[80px]" />
      <h2 className="text-sm font-semibold text-content-strong">Resultado da simulação</h2>
      <p className="mt-2 pr-24 text-xs text-content">O resultado aparece aqui assim que você calcular.</p>
      <div className="mt-8 flex flex-1 flex-col [&>*]:flex-1"><FinanceEmptyState title="Nenhuma simulação ainda" description={description} /></div>
    </section>
  );
}
