"use client";

import { CalendarClock, CreditCard, ShoppingBag, Wifi } from "lucide-react";

import { CreditCardHeroDetail } from "@/components/finance/credit-card-hero-detail";
import { CreditCardNextInvoiceCard } from "@/components/finance/credit-card-next-invoice-card";
import { formatDateLabel } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { CreditCardHeroProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardHero({ overview, nextInvoice }: CreditCardHeroProps) {
  const { formatCurrency } = useFinancialFormatter();
  const isPaid = overview.invoice.bill?.status === "paid";
  const paidLabel = overview.invoice.bill?.paidAt
    ? `Paga em ${formatDateLabel(overview.invoice.bill.paidAt)}`
    : "Fatura paga";
  const dueLabel = overview.invoice.bill?.dueDate
    ? formatDateLabel(overview.invoice.bill.dueDate)
    : `Dia ${overview.account.creditDueDay}`;

  return (
    <section aria-label="Resumo da fatura" className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
      <div className="bg-hero shadow-elevation relative flex min-h-[208px] min-w-0 flex-col justify-between overflow-hidden rounded-[24px] p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full border border-white/15" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full border border-white/10" />
        <div className="relative flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-white/75 uppercase"><CreditCard aria-hidden="true" className="size-4" />Cartão de crédito</span>
          <span className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isPaid ? "bg-emerald-400/25 text-emerald-50" : "bg-amber-300/25 text-amber-50"}`}>{isPaid ? paidLabel : "Em aberto"}</span>
            <Wifi aria-hidden="true" className="size-4 rotate-90 text-white/70" />
          </span>
        </div>
        <div className="relative">
          <p className="text-xs font-medium text-white/75">Valor total da fatura</p>
          <p className="mt-1 text-[38px] leading-[1.1] font-semibold tracking-[-1.2px] break-words tabular-nums">{formatCurrency(overview.invoice.totalAmountCents)}</p>
        </div>
        <div className="relative flex items-end justify-between gap-3 text-xs text-white/80">
          <p data-user-content className="truncate text-sm font-medium text-white">{overview.account.name}</p>
          <p className="shrink-0">Vence {dueLabel}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <CreditCardHeroDetail
          label="Vencimento"
          value={dueLabel}
          detail={`Fecha dia ${overview.account.creditClosingDay ?? "—"}`}
          icon={<CalendarClock />}
          tone="warning"
        />
        <CreditCardHeroDetail
          label="Compras e parcelas"
          value={String(overview.invoice.purchaseCount)}
          detail={overview.invoice.bill ? "Leitura baseada na fatura fechada" : "Leitura baseada nos lançamentos"}
          icon={<ShoppingBag />}
          tone="violet"
        />
        <CreditCardNextInvoiceCard
          accountId={overview.account.id}
          creditDueDay={overview.account.creditDueDay}
          nextInvoice={nextInvoice}
        />
      </div>
    </section>
  );
}
