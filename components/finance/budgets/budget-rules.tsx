import { BudgetCard } from "./budget-card";

export function BudgetRules() {
  return (
    <BudgetCard title="Como o consumo é calculado" description="O que entra e o que fica fora dos limites" illustrationSrc="/images/budgets-calculation.webp">
      <dl className="divide-y divide-border text-[13px] leading-5">
        <div className="pb-3"><dt className="font-semibold text-content-strong">Realizado</dt><dd className="mt-1 text-content">Despesas efetivadas e parcelas ou ajustes da fatura do mês, independentemente do pagamento.</dd></div>
        <div className="py-3"><dt className="font-semibold text-content-strong">Comprometido</dt><dd className="mt-1 text-content">Realizado + pendente. Créditos e estornos reduzem o consumo. O saldo considera apenas as categorias com limite.</dd></div>
        <div className="pt-3"><dt className="font-semibold text-content-strong">Fora do cálculo</dt><dd className="mt-1 text-content-muted">Cancelados, transferências, aportes, resgates e pagamentos de fatura. Despesas sem limite ou categoria aparecem separadamente.</dd></div>
      </dl>
    </BudgetCard>
  );
}
