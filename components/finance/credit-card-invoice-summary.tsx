"use client";

import { CreditCardNextInvoiceCard } from "@/components/finance/credit-card-next-invoice-card";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { formatDateLabel } from "@/lib/finance-ui";
import type { CreditCardInvoiceSummaryProps } from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";

export function CreditCardInvoiceSummary({ overview, nextInvoice }: CreditCardInvoiceSummaryProps) {
  const { bill } = overview.invoice;
  const isPaid = bill?.status === "paid";
  const statusLabel = isPaid ? (bill?.paidAt ? `Paga em ${formatDateLabel(bill.paidAt)}` : "Fatura paga") : "Em aberto";
  const dueLabel = bill?.dueDate ? formatDateLabel(bill.dueDate) : `Dia ${overview.account.creditDueDay}`;
  const rows = [
    { label: "Vencimento", value: dueLabel },
    { label: "Fechamento", value: overview.account.creditClosingDay ? `Dia ${overview.account.creditClosingDay}` : "Não configurado" },
    { label: "Compras e parcelas", value: String(overview.invoice.purchaseCount) },
  ];
  return (
    <section aria-label="Resumo da fatura" className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/reports-clipboard.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Resumo da fatura</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Status e datas do ciclo selecionado</p>
      <p className={cn("tone-soft mt-5 inline-flex rounded-full px-3 py-1 text-xs font-semibold", isPaid ? "tone-success" : "tone-warning")}>{statusLabel}</p>
      <dl className="mt-3 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-3.5 text-[13px]">
            <dt className="text-content">{row.label}</dt>
            <dd className="font-semibold text-content-strong">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3">
        <CreditCardNextInvoiceCard accountId={overview.account.id} creditDueDay={overview.account.creditDueDay} nextInvoice={nextInvoice} />
      </div>
    </section>
  );
}
