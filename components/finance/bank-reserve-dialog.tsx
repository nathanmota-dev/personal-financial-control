"use client";

import { PiggyBank } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CurrencyInput } from "@/components/finance/calculators/currency-input";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BankReserveDialogProps } from "@/lib/interfaces/components/bank-reserve";
import { bankReserveShortcuts, formatReserveInput, parseReserveInput } from "@/lib/utils/components/bank-reserve";
import { BankReserveSubmit } from "@/lib/utils/component-actions/bank-reserve-submit";

export function BankReserveDialog({ split, open, onOpenChange }: BankReserveDialogProps) {
  const router = useRouter();
  const { formatCurrency } = useFinancialFormatter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(formatReserveInput(split.reserveCents));
  const parsed = parseReserveInput(value);
  const invalid = parsed === null;
  const reserveCents = parsed ?? 0;
  const aboveTotal = reserveCents > split.totalCents;
  const portfolioCents = invalid || aboveTotal ? 0 : split.totalCents - reserveCents;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-content-strong sm:max-w-lg">
        <DialogHeader icon={<PiggyBank />} tone="brand">
          <DialogTitle>Quanto é reserva?</DialogTitle>
          <DialogDescription className="leading-6 text-content">
            Do total que o banco informou, defina a parte que é reserva de emergência. O restante fica como investimentos. O valor só muda quando você ajustar aqui.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(() => void BankReserveSubmit({ reserveCents, router, onDone: () => onOpenChange(false) }));
          }}
        >
          <CurrencyInput id="bank-reserve-amount" label="Reserva" value={value} onValueChange={setValue} />
          <div className="flex flex-wrap gap-2">
            {bankReserveShortcuts(split.totalCents).map((shortcut) => (
              <Button key={shortcut.label} type="button" variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setValue(formatReserveInput(shortcut.cents))}>
                {shortcut.label}
              </Button>
            ))}
          </div>
          <dl className="grid grid-cols-3 gap-4 rounded-xl border border-border p-4 text-xs">
            <div className="min-w-0"><dt className="text-content">Total investido</dt><dd className="mt-1 text-[15px] font-semibold text-content-strong">{formatCurrency(split.totalCents)}</dd></div>
            <div className="min-w-0"><dt className="text-content">Reserva</dt><dd className="mt-1 text-[15px] font-semibold text-content-strong">{formatCurrency(invalid || aboveTotal ? 0 : reserveCents)}</dd></div>
            <div className="min-w-0"><dt className="text-content">Investimentos</dt><dd className="mt-1 text-[15px] font-semibold text-content-strong">{formatCurrency(portfolioCents)}</dd></div>
          </dl>
          {aboveTotal ? <p role="alert" className="text-xs text-destructive">A reserva não pode passar do total investido.</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || invalid || aboveTotal}>{isPending ? "Salvando..." : "Salvar reserva"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
