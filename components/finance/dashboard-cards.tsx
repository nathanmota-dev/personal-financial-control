"use client";

import { useState } from "react";

import { CreditCardInvoiceChart } from "@/components/finance/credit-card-invoice-chart";
import { CreditCardVisual } from "@/components/finance/credit-card-visual";
import { DashboardCardsHeader } from "@/components/finance/dashboard-cards-header";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { longMonthName } from "@/lib/dashboard-cards";
import type { DashboardCardsProps } from "@/lib/interfaces/dashboard-cards";

export function DashboardCards({ cards, month }: DashboardCardsProps) {
  const [index, setIndex] = useState(0);
  const active = cards[Math.min(index, cards.length - 1)];
  // Each card may start at a later invoice than the dashboard month once its due date has passed.
  const invoiceMonth = active?.invoices[0]?.month ?? month;

  if (!active) {
    return (
      <section className="min-w-0 rounded-[20px] border border-border bg-card p-[23px]">
        <h2 className="text-sm font-semibold text-content-strong">Cartões</h2>
        <div className="mt-4">
          <FinanceEmptyState
            title="Nenhum cartão cadastrado"
            description="Cadastre uma conta do tipo cartão para acompanhar faturas aqui."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="@container min-w-0 rounded-[20px] border border-border bg-card p-[23px] xl:min-h-[560px]">
      <DashboardCardsHeader
        monthLabel={longMonthName(invoiceMonth)}
        totalCents={active.invoices[0]?.totalCents ?? 0}
        month={invoiceMonth}
        cardId={active.id}
        canPrevious={index > 0}
        canNext={index < cards.length - 1}
        onPrevious={() => setIndex((value) => Math.max(0, value - 1))}
        onNext={() => setIndex((value) => Math.min(cards.length - 1, value + 1))}
      />
      <div className="mt-5 overflow-hidden pb-3" style={{ ["--card-w" as string]: "min(300px, 84cqw)" }}>
        <div
          data-testid="credit-card-track"
          className="flex gap-3 transition-transform duration-300"
          style={{ transform: `translateX(calc(${index} * (var(--card-w) + 0.75rem) * -1))` }}
        >
          {cards.map((card) => (
            <div key={card.id} className="shrink-0" style={{ width: "var(--card-w)" }}>
              <CreditCardVisual card={card} />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-6 mb-3 text-[10px] font-bold tracking-wider text-content uppercase">
        Próximas faturas
      </p>
      <CreditCardInvoiceChart invoices={active.invoices} />
    </section>
  );
}
