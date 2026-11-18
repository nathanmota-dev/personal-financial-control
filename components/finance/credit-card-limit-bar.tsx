"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { creditCardLimitSegments, creditCardLimitUsedPercent, formatLimitPercent } from "@/lib/credit-card-limit";
import { formatDateLabel } from "@/lib/finance-ui";
import type { CreditCardLimitBarProps } from "@/lib/interfaces/credit-card-limit";
import { cn } from "@/lib/utils";

export function CreditCardLimitBar({ limit }: CreditCardLimitBarProps) {
  const { formatCurrency, protect, protectText } = useFinancialFormatter();
  const segments = creditCardLimitSegments(limit);
  const overLimit = limit.availableCents < 0;
  return (
    <section aria-label="Limite do cartão" data-testid="credit-card-limit" className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[10px] font-bold tracking-wider text-content uppercase">Limite do cartão</p>
        <p className="text-xs text-content">
          <span className={cn("font-semibold", overLimit ? "text-destructive" : "text-content-strong")}>{formatCurrency(limit.usedCents)}</span>
          {" usados de "}
          <span className="font-semibold text-content-strong">{formatCurrency(limit.limitCents)}</span>
          <span className="ml-1.5 text-[11px] text-content-subtle">{protect(`${creditCardLimitUsedPercent(limit)}%`)}</span>
        </p>
      </div>
      <div
        role="img"
        aria-label={protectText(`${creditCardLimitUsedPercent(limit)}% do limite usado`)}
        className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface"
      >
        {segments.map((segment) => (
          <div key={segment.key} data-segment={segment.key} className={cn("h-full", segment.colorClassName)} style={{ width: `${segment.width}%` }} />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 @md:grid-cols-3">
        {segments.map((segment) => (
          <div key={segment.key}>
            <dt className="flex items-center gap-1.5 text-xs text-content">
              <span aria-hidden className={cn("size-2 shrink-0 rounded-full", segment.colorClassName)} />
              {segment.label}
            </dt>
            <dd className={cn("mt-1 text-[15px] font-semibold", segment.amountCents < 0 ? "text-destructive" : "text-content-strong")}>
              {formatCurrency(segment.amountCents)}
              <span className="ml-1.5 text-[11px] font-normal text-content-subtle">{protect(formatLimitPercent(segment.percent))}</span>
            </dd>
            <dd className="mt-0.5 text-[11px] text-content-muted">{segment.hint}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[11px] text-content-subtle">{`Limite informado pelo banco em ${formatDateLabel(limit.collectedOn)}.`}</p>
    </section>
  );
}
