"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { CreditCardInvoiceChart } from "@/components/finance/credit-card-invoice-chart";
import { CreditCardVisual } from "@/components/finance/credit-card-visual";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { Button } from "@/components/ui/button";
import { longMonthName } from "@/lib/dashboard-cards";
import type { CreditCardsShowcaseProps } from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";

export function CreditCardsShowcase({ cards, selectedId, month, onSelect }: CreditCardsShowcaseProps) {
  const index = Math.max(0, cards.findIndex((card) => card.id === selectedId));
  const active = cards[index];
  if (!active) return null;
  return (
    <section aria-label="Cartões" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/credit-card-cards.webp" className="top-4 right-6 size-[96px]" />
      <h2 className="text-sm font-semibold text-content-strong">Cartões</h2>
      <p className="mt-6 text-[13px] font-medium text-content">
        {`Fatura de ${longMonthName(month)} · `}
        <span data-user-content>{active.name}</span>
      </p>
      <DashboardCardsMoney cents={active.invoices[0]?.totalCents ?? 0} className="mt-1 block text-[48px] leading-[52px] font-bold text-content-strong" />
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs text-content">{`Cartão ${index + 1} de ${cards.length}`}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon-sm" className="rounded-full" aria-label="Cartão anterior" disabled={index === 0} onClick={() => onSelect(cards[index - 1].id)}>
            <ChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="icon-sm" className="rounded-full" aria-label="Próximo cartão" disabled={index === cards.length - 1} onClick={() => onSelect(cards[index + 1].id)}>
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="mt-4 overflow-hidden pb-3" style={{ ["--card-w" as string]: "min(420px, 84cqw)" }}>
        <div data-testid="credit-card-track" className="flex gap-4 transition-transform duration-300" style={{ transform: `translateX(calc(${index} * (var(--card-w) + 1rem) * -1))` }}>
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              aria-pressed={card.id === active.id}
              aria-label={`Selecionar cartão ${card.name}`}
              onClick={() => onSelect(card.id)}
              className={cn("shrink-0 rounded-[14px] text-left outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring", card.id === active.id ? "opacity-100" : "opacity-60 hover:opacity-90")}
              style={{ width: "var(--card-w)" }}
            >
              <CreditCardVisual card={card} className="h-[236px] p-6" />
            </button>
          ))}
        </div>
      </div>
      <p className="mt-6 mb-3 text-[10px] font-bold tracking-wider text-content uppercase">Próximas faturas</p>
      <CreditCardInvoiceChart invoices={active.invoices} />
    </section>
  );
}
