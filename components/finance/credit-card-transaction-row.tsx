"use client";
import { CreditCardChargeActions } from "@/components/finance/credit-card-charge-actions";
import { Badge } from "@/components/ui/badge";
import { formatCreditCardMonth } from "@/lib/credit-card-view";
import { formatCurrency } from "@/lib/finance-ui";
import type { CreditCardTransactionRowProps } from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";
import { ArrowDownUp,MoreHorizontal,Tag } from "lucide-react";

export function CreditCardTransactionRow({
  accountId,
  categories,
  month,
  entry,
}: CreditCardTransactionRowProps) {
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
    <article className="group grid grid-cols-[2rem_2.25rem_minmax(0,1fr)] gap-3 px-5 py-4 transition-colors hover:bg-surface sm:flex sm:px-6">
      <div className="w-8 shrink-0 pt-0.5 text-center">
        <p className="text-[0.68rem] font-semibold text-content-subtle">
          {formatCreditCardMonth(entry.purchaseDate.slice(0, 7)).split(" ")[0]}
        </p>
        <p className="mt-0.5 text-xl font-semibold leading-none text-content">
          {entry.purchaseDate.slice(8, 10)}
        </p>
      </div>
      <div className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", isAdjustment ? "bg-warning/10 text-warning" : "bg-brand/10 text-brand")}>
        {isAdjustment ? <ArrowDownUp className="size-4" /> : <Tag className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-words text-sm font-semibold text-content-strong">{entry.description}</p>
          {entry.installmentNumber && entry.installmentCount ? (
            <Badge variant="outline" className="border-input text-[0.68rem] text-content">
              {entry.installmentNumber}/{entry.installmentCount}
            </Badge>
          ) : null}
          {isAdjustment ? (
            <Badge variant="outline" className="border-warning/30 text-[0.68rem] text-warning">
              Ajuste
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-content-muted">{entry.category?.name ?? "Sem categoria"}</p>
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
