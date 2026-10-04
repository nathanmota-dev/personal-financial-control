import { CreditCard } from "lucide-react";

import { CreditCardHeroDetail } from "@/components/finance/credit-card-hero-detail";
import { CreditCardNextInvoiceCard } from "@/components/finance/credit-card-next-invoice-card";
import { FinanceMetric } from "@/components/finance/finance-metric";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import type { CreditCardHeroProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardHero({ overview, nextInvoice }: CreditCardHeroProps) {
  const isPaid = overview.invoice.bill?.status === "paid";
  const paidLabel = overview.invoice.bill?.paidAt
    ? `Paga em ${formatDateLabel(overview.invoice.bill.paidAt)}`
    : "Fatura paga";
  const dueLabel = overview.invoice.bill?.dueDate
    ? formatDateLabel(overview.invoice.bill.dueDate)
    : `Dia ${overview.account.creditDueDay}`;

  return (
    <section aria-label="Resumo da fatura" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <FinanceMetric
        label="Valor total da fatura"
        value={formatCurrency(overview.invoice.totalAmountCents)}
        description={isPaid ? paidLabel : "Em aberto"}
        icon={<CreditCard />}
        tone={isPaid ? "success" : "warning"}
      />
      <CreditCardHeroDetail
        label="Vencimento"
        value={dueLabel}
        detail={`Fecha dia ${overview.account.creditClosingDay ?? "—"}`}
      />
      <CreditCardHeroDetail
        label="Compras e parcelas"
        value={String(overview.invoice.purchaseCount)}
        detail={overview.invoice.bill ? "Leitura baseada na fatura fechada" : "Leitura baseada nos lançamentos"}
      />
      <CreditCardNextInvoiceCard
        accountId={overview.account.id}
        creditDueDay={overview.account.creditDueDay}
        nextInvoice={nextInvoice}
      />
    </section>
  );
}
