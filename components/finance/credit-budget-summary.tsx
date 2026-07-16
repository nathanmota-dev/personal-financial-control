import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { financePanelClassName } from "@/components/finance/finance-styles";
import { formatCurrency } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

export function CreditBudgetSummary({
  incomeCents,
  nonCardExpenseCents,
  investmentContributionCents,
  investmentWithdrawalCents,
  availableForInvoiceCents,
  invoiceTotalCents,
}: {
  incomeCents: number;
  nonCardExpenseCents: number;
  investmentContributionCents: number;
  investmentWithdrawalCents: number;
  availableForInvoiceCents: number;
  invoiceTotalCents: number;
}) {
  const totalCommittedCents =
    nonCardExpenseCents + investmentContributionCents - investmentWithdrawalCents;

  return (
    <Card className={financePanelClassName}>
      <CardHeader>
        <CardTitle>Resumo mensal para gasto no cartão</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-400">Entradas totais do mês</p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-cyan-300">
            {formatCurrency(incomeCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-400">Gastos fora do cartão + investimentos líquidos</p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-blue-300">
            {formatCurrency(totalCommittedCents)}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Despesas fora do cartão somadas aos aportes e descontando os resgates.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm text-slate-400">Disponível para a fatura</p>
          <p
            className={cn(
              "mt-2 font-heading text-3xl font-semibold tracking-tight",
              availableForInvoiceCents >= invoiceTotalCents ? "text-cyan-300" : "text-rose-300"
            )}
          >
            {formatCurrency(availableForInvoiceCents)}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Fatura do mês: {formatCurrency(invoiceTotalCents)}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
