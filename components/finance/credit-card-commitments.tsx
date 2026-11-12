"use client";

import { Receipt } from "lucide-react";

import { CategoryChip } from "@/components/finance/ds/category-chip";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Badge } from "@/components/ui/badge";
import { formatCreditCardMonth } from "@/lib/credit-card-view";
import type { CreditCardCommitmentsProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardCommitments({ overview }: CreditCardCommitmentsProps) {
  const { formatCurrency } = useFinancialFormatter();
  const futureCharges = overview.invoice.futureInstallments.slice(0, 5);

  return (
    <aside className="space-y-6 min-[100.0625rem]:space-y-5">
      <section className="relative rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
        <DashboardCardIllustration src="/images/budgets-calculation.webp" />
        <h2 className="text-lg font-semibold leading-[25px]">Parcelas em aberto</h2>
        <p className="mt-1 pr-16 text-xs text-content-muted">Compromissos das próximas faturas</p>
        <div className="mt-5 space-y-3">
          {futureCharges.length ? futureCharges.map((charge) => (
            <div key={charge.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p data-user-content className="truncate text-[13px] font-medium text-content-strong">{charge.description}</p>
                  <div className="mt-1.5"><CategoryChip name={charge.category?.name} /></div>
                </div>
                <p className="shrink-0 text-[13px] font-semibold text-content-strong">{formatCurrency(charge.remainingAmountCents)}</p>
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
          <p className="mt-5 text-xs text-content-subtle">Valores estimados a partir dos lançamentos cadastrados</p>
        ) : null}
      </section>

      <div className="px-1 text-xs leading-5 text-content">
        Ciclo atual: {overview.account.creditClosingDay ? `fecha dia ${overview.account.creditClosingDay}` : "fechamento não configurado"} · vencimento dia {overview.account.creditDueDay} · mês {formatCreditCardMonth(overview.month)}.
      </div>
    </aside>
  );
}
