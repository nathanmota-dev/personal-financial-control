"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/finance-ui";
import type { ReserveWithdrawalRowProps } from "@/lib/interfaces/components/reserve-withdrawal";
import type { ReserveWithdrawalChoice } from "@/lib/interfaces/reserve-withdrawal";
import { ReserveWithdrawalSubmit } from "@/lib/utils/component-actions/reserve-withdrawal-submit";

export function ReserveWithdrawalRow({ withdrawal }: ReserveWithdrawalRowProps) {
  const router = useRouter();
  const { formatCurrency } = useFinancialFormatter();
  const [isPending, startTransition] = useTransition();
  const choose = (origin: ReserveWithdrawalChoice) =>
    startTransition(() => void ReserveWithdrawalSubmit({ transactionId: withdrawal.id, origin, router }));
  const label = `${withdrawal.description} em ${formatDateLabel(withdrawal.transactionDate)}`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px]">
      <div className="min-w-0">
        <p className="truncate font-medium text-content-strong">{withdrawal.description}</p>
        <p className="mt-0.5 text-[11px] text-content-subtle">
          {formatDateLabel(withdrawal.transactionDate)}{withdrawal.accountName ? ` · ${withdrawal.accountName}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-content-strong">{formatCurrency(withdrawal.amountCents)}</span>
        <div role="group" aria-label={`Origem de ${label}`} className="flex gap-1.5">
          <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg text-xs" disabled={isPending} onClick={() => choose("reserve")}>Reserva</Button>
          <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg text-xs" disabled={isPending} onClick={() => choose("portfolio")}>Carteira</Button>
        </div>
      </div>
    </li>
  );
}
