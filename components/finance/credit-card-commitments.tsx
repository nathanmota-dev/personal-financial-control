import { ArrowRight,CalendarRange,Layers3,Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCreditCardMonth } from "@/lib/credit-card-view";
import { formatCurrency } from "@/lib/finance-ui";
import type { CreditCardCommitmentsProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardCommitments({ overview, monthPoints }: CreditCardCommitmentsProps) {
  const upcomingPoints = monthPoints.filter((point) => point.month > overview.month).slice(0, 3);
  const futureCharges = overview.invoice.futureInstallments.slice(0, 5);

  return (
    <aside className="space-y-6">
      <section className="rounded-xl border border-border bg-card px-[22px] py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-content-strong">Próximas faturas</h2>
            <p className="mt-1 text-xs text-content-muted">Previsão dos próximos três meses</p>
          </div>
          <CalendarRange className="size-5 text-brand" />
        </div>
        <div className="mt-4 divide-y divide-border">
          {upcomingPoints.map((point) => (
            <div key={point.month} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-content-strong">{formatCreditCardMonth(point.month)}</p>
                <p className="mt-0.5 text-xs text-content-subtle">{point.entryCount ? `${point.entryCount} parcela${point.entryCount === 1 ? "" : "s"}` : "Sem lançamentos previstos"}</p>
              </div>
              <p className="text-sm font-semibold text-content-strong">{formatCurrency(point.totalCents)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card px-[22px] py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-content-strong">Parcelas em aberto</h2>
            <p className="mt-1 text-xs text-content-muted">Compromissos das próximas faturas</p>
          </div>
          <Layers3 className="size-5 text-brand" />
        </div>
        <div className="mt-5 space-y-3">
          {futureCharges.length ? futureCharges.map((charge) => (
            <div key={charge.id} className="border-b border-border/70 pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-content-strong">{charge.description}</p>
                  <p className="mt-1 truncate text-xs text-content-subtle">{charge.category?.name ?? "Sem categoria"}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-content">{formatCurrency(charge.remainingAmountCents)}</p>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="border-input text-[0.68rem] text-content">
                  {charge.installments.length} futuras
                </Badge>
                <span className="text-[0.68rem] text-content-subtle">até {formatCreditCardMonth(charge.installments.at(-1)?.invoiceMonth ?? overview.month)}</span>
              </div>
            </div>
          )) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-7 text-center">
              <Receipt className="mx-auto size-5 text-content-subtle" />
              <p className="mt-3 text-sm text-content">Nenhuma parcela futura.</p>
            </div>
          )}
        </div>
        {futureCharges.length ? (
          <p className="mt-5 flex items-center gap-1 text-xs text-content-subtle">
            <ArrowRight className="size-3.5" /> Valores estimados a partir dos lançamentos cadastrados
          </p>
        ) : null}
      </section>

      <div className="px-1 text-xs leading-5 text-content">
        Ciclo atual: {overview.account.creditClosingDay ? `fecha dia ${overview.account.creditClosingDay}` : "fechamento não configurado"} · vencimento dia {overview.account.creditDueDay} · mês {formatCreditCardMonth(overview.month)}.
      </div>
    </aside>
  );
}
