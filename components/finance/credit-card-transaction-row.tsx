"use client";

import { CategoryChip } from "@/components/finance/ds/category-chip";
import { IconTile } from "@/components/finance/ds/icon-tile";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { toneForKey } from "@/lib/finance-tone";
import { CreditCardChargeActions } from "@/components/finance/credit-card-charge-actions";
import { formatCreditCardMonth } from "@/lib/credit-card-view";
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
    <article className="group grid grid-cols-[2rem_2.25rem_minmax(0,1fr)] gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex sm:px-6">
      <div className="w-8 shrink-0 pt-0.5 text-center">
        <p className="text-[0.68rem] font-semibold text-content-subtle">
          {formatCreditCardMonth(entry.purchaseDate.slice(0, 7)).split(" ")[0]}
        </p>
        <p className="mt-0.5 text-xl font-semibold leading-none text-content">
          {entry.purchaseDate.slice(8, 10)}
        </p>
      </div>
      <IconTile tone={isAdjustment ? "warning" : toneForKey(entry.category?.name)} size="sm" className="mt-0.5 size-9">
        {isAdjustment ? <ArrowDownUp /> : <Tag />}
      </IconTile>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p data-user-content className="break-words text-sm font-semibold text-content-strong">{entry.description}</p>
          {entry.installmentNumber && entry.installmentCount ? (
            <ToneChip tone="brand" className="h-5 px-1.5 text-[0.68rem]">
              {entry.installmentNumber}/{entry.installmentCount}
            </ToneChip>
          ) : null}
          {isAdjustment ? (
            <ToneChip tone="warning" className="h-5 px-1.5 text-[0.68rem]">Ajuste</ToneChip>
          ) : null}
        </div>
        <div className="mt-1.5"><CategoryChip name={entry.category?.name} /></div>
      </div>
      <div className="col-start-3 flex flex-wrap items-center gap-2 sm:ml-auto sm:shrink-0 sm:flex-nowrap">
        <p className={cn("pt-1 text-right text-sm font-semibold", isAdjustment ? "text-warning" : "text-content-strong")}>
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
          <MoreHorizontal className="mt-1 hidden size-4 text-content-subtle sm:block" />
        )}
      </div>
    </article>
  );
}
