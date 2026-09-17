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
        <div className="rounded-2xl border border-border bg-surface/60 p-4">
          <p className="text-sm text-content">Entradas totais do mês</p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-brand">
            {formatCurrency(incomeCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/60 p-4">
          <p className="text-sm text-content">Gastos fora do cartão + investimentos líquidos</p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-brand">
            {formatCurrency(totalCommittedCents)}
          </p>
          <p className="mt-2 text-xs leading-5 text-content-strong0">
            Despesas fora do cartão somadas aos aportes e descontando os resgates.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/60 p-4">
          <p className="text-sm text-content">Disponível para a fatura</p>
          <p
            className={cn(
              "mt-2 font-heading text-3xl font-semibold tracking-tight",
              availableForInvoiceCents >= invoiceTotalCents ? "text-brand" : "text-danger"
            )}
          >
            {formatCurrency(availableForInvoiceCents)}
          </p>
          <p className="mt-2 text-xs leading-5 text-content-strong0">
            Fatura do mês: {formatCurrency(invoiceTotalCents)}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
