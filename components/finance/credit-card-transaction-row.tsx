"use client";

import { CategoryChip } from "@/components/finance/ds/category-chip";
import { IconTile } from "@/components/finance/ds/icon-tile";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { toneForKey } from "@/lib/finance-tone";
import { CreditCardChargeActions } from "@/components/finance/credit-card-charge-actions";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { CreditCardTransactionRowProps } from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";
import { ArrowDownUp,MoreHorizontal,Tag } from "lucide-react";

export function CreditCardTransactionRow({
  accountId,
  categories,
  month,
  entry,
}: CreditCardTransactionRowProps) {
  const { formatCurrency } = useFinancialFormatter();
  const isAdjustment = entry.kind === "adjustment" || entry.amountCents < 0;
  const actionCharge = entry.chargeId && entry.totalAmountCents
    ? {
        id: entry.chargeId,
        accountId,
        categoryId: entry.category?.id ?? "",
        description: entry.description,
        notes: entry.notes,
        purchaseDate: entry.purchaseDate,
        totalAmountCents: entry.totalAmountCents,
        installmentCount: entry.installmentCount ?? 1,
        kind: entry.kind,
      }
    : null;

  return (
    <article className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40 sm:px-6">
      <IconTile tone={isAdjustment ? "warning" : toneForKey(entry.category?.name)} size="sm" className="size-9 shrink-0">
        {isAdjustment ? <ArrowDownUp /> : <Tag />}
      </IconTile>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p data-user-content className="break-words text-[13px] font-semibold text-content-strong">{entry.description}</p>
          {entry.installmentNumber && entry.installmentCount ? (
            <ToneChip tone="brand" className="h-5 px-1.5 text-[0.68rem]">
              {entry.installmentNumber}/{entry.installmentCount}
            </ToneChip>
          ) : null}
          {isAdjustment ? (
            <ToneChip tone="warning" className="h-5 px-1.5 text-[0.68rem]">Ajuste</ToneChip>
          ) : null}
        </div>
        <div className="mt-1.5 sm:hidden"><CategoryChip name={entry.category?.name} /></div>
      </div>
      <div className="hidden w-[200px] shrink-0 sm:block"><CategoryChip name={entry.category?.name} /></div>
      <div className="flex shrink-0 items-center gap-2">
        <p className={cn("text-right text-[13px] font-semibold", isAdjustment ? "text-warning" : "text-content-strong")}>
          {formatCurrency(entry.amountCents)}
        </p>
        {actionCharge ? (
          <CreditCardChargeActions
            accountId={accountId}
            categories={categories}
            month={month}
            charge={actionCharge}
          />
        ) : (
          <MoreHorizontal className="hidden size-4 text-content-subtle sm:block" />
        )}
      </div>
    </article>
  );
}
