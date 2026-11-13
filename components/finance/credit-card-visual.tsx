"use client";

import { CreditCardBrandLogo } from "@/components/finance/credit-card-brand-logo";
import { CreditCardChip } from "@/components/finance/credit-card-chip";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { CARD_BRAND_THEMES } from "@/lib/credit-card-brands";
import { cardProductName, formatCardDueDate } from "@/lib/dashboard-cards";
import type { CreditCardVisualProps } from "@/lib/interfaces/dashboard-cards";
import { cn } from "@/lib/utils";

export function CreditCardVisual({ card, className, details, statusLabel: statusOverride }: CreditCardVisualProps) {
  const { formatCurrency } = useFinancialFormatter();
  const theme = CARD_BRAND_THEMES[card.brand];
  const [current] = card.invoices;
  const statusLabel = statusOverride === undefined ? (current?.status === "paid" ? "Paga" : "Aberta") : statusOverride;
  const [left, right] = details ?? [
    { label: "Vence", value: formatCardDueDate(card.dueDate) },
    { label: "Fatura", value: formatCurrency(current?.totalCents ?? 0) },
  ];
  return (
    <div className="relative">
    <div aria-hidden className="absolute inset-x-3 -bottom-1 h-4 rounded-[50%] bg-black/50 blur-[7px]" />
    <div
      data-testid="credit-card-visual"
      data-brand={card.brand}
      className={cn(
        "relative flex h-[172px] w-full flex-col justify-between overflow-hidden rounded-[14px] p-4 shadow-sm",
        theme.faceClassName,
        theme.textClassName,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <CreditCardBrandLogo brand={card.brand} name={card.name} />
        {statusLabel ? (
          <span className={cn("rounded-full px-2.5 py-[3px] text-[10px] font-semibold", theme.badgeClassName)}>
            {statusLabel}
          </span>
        ) : null}
      </div>
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-4">
        <CreditCardChip className="text-white/70" />
        <span data-user-content className="max-w-[120px] truncate text-[11px] font-medium tracking-[0.35em] uppercase">
          {cardProductName(card.name, card.brand)}
        </span>
        <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round">
          <path d="M8 8c1.500 2.500 1.500 5.500 0 8M12 6c2.500 3.500 2.500 8.500 0 12M16 4c3.500 4.500 3.500 11.500 0 16" />
        </svg>
      </div>
      <div className="flex items-end justify-between text-[9px] font-semibold tracking-wider uppercase">
        <div>
          <p className="opacity-70">{left.label}</p>
          <p className="mt-0.5 text-[11px]">{left.value}</p>
        </div>
        <div className="text-right">
          <p className="opacity-70">{right.label}</p>
          <p className="mt-0.5 text-[11px]">{right.value}</p>
        </div>
      </div>
    </div>
    </div>
  );
}
