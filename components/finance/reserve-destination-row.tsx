"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CurrencyInput } from "@/components/finance/calculators/currency-input";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { ReserveShortcutButtons } from "@/components/finance/reserve-shortcut-buttons";
import { Button } from "@/components/ui/button";
import { formatDateLabel } from "@/lib/finance-ui";
import type { ReserveDestinationRowProps } from "@/lib/interfaces/components/reserve-destination";
import { ReserveDestinationSubmit } from "@/lib/utils/component-actions/reserve-destination-submit";
import { formatReserveInput, parseReserveInput } from "@/lib/utils/components/bank-reserve";
import { reserveDestinationShortcuts } from "@/lib/utils/components/reserve-destination";

export function ReserveDestinationRow({ contribution }: ReserveDestinationRowProps) {
  const router = useRouter();
  const { formatCurrency } = useFinancialFormatter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(contribution.reserveShareCents === null ? "" : formatReserveInput(contribution.reserveShareCents));
  const parsed = parseReserveInput(value);
  const aboveAmount = parsed !== null && parsed > contribution.amountCents;
  const reserveCents = parsed === null || aboveAmount ? null : parsed;
  const unchanged = reserveCents !== null && reserveCents === contribution.reserveShareCents;
  const inputId = `reserve-destination-${contribution.id}`;
  const save = () => {
    if (reserveCents === null) return;
    startTransition(() => void ReserveDestinationSubmit({ transactionId: contribution.id, reserveCents, router }));
  };

  return (
    <li className="space-y-3 py-4 text-[13px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-content-strong">{contribution.description}</p>
          <p className="mt-0.5 text-[11px] text-content-subtle">
            {formatDateLabel(contribution.transactionDate)}{contribution.accountName ? ` · ${contribution.accountName}` : ""}{contribution.pending ? " · Pendente" : ""}
          </p>
          {contribution.beforeReserve ? (
            <p className="mt-1 text-[11px] leading-4 text-warning">Anterior ao valor que você definiu para a reserva. Informe uma parte só se aquele valor não incluía este aporte.</p>
          ) : null}
        </div>
        <span className="font-semibold text-content-strong">{formatCurrency(contribution.amountCents)}</span>
      </div>
      <form
        className="grid gap-3"
        aria-label={`Destino de ${contribution.description} em ${formatDateLabel(contribution.transactionDate)}`}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <CurrencyInput id={inputId} label="Parte da reserva" value={value} onValueChange={setValue} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ReserveShortcutButtons className="gap-1.5" shortcuts={reserveDestinationShortcuts(contribution.amountCents)} onPick={(cents) => setValue(formatReserveInput(cents))} />
          <p className="text-[11px] text-content">
            Investimentos: <span className="font-semibold text-content-strong">{formatCurrency(reserveCents === null ? contribution.amountCents : contribution.amountCents - reserveCents)}</span>
          </p>
        </div>
        {aboveAmount ? <p role="alert" className="text-xs text-destructive">A parte da reserva não pode passar do valor do aporte.</p> : null}
        <div className="flex justify-end">
          <Button type="submit" size="sm" className="h-8 rounded-lg text-xs" disabled={isPending || reserveCents === null || unchanged}>
            {isPending ? "Salvando..." : "Salvar destino"}
          </Button>
        </div>
      </form>
    </li>
  );
}
