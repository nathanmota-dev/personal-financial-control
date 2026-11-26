"use client";

import { DayOfMonthGrid } from "@/components/finance/day-of-month-grid";
import { Button } from "@/components/ui/button";
import {
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle
} from "@/components/ui/dialog";
import type { CreditCardNextInvoiceCardDialogContent1Props } from "@/lib/interfaces/render/credit-card-next-invoice-card-credit-card-next-invoice-card-dialog-content1";
import { CalendarDays } from "lucide-react";

export function CreditCardNextInvoiceCardDialogContent1({ selectedDay, setSelectedDay, setOpen, isSaving, saveDueDay, creditDueDay }: CreditCardNextInvoiceCardDialogContent1Props) {
  return (
<DialogContent className="max-w-md gap-5 border-border bg-card p-5 sm:p-6">
        <DialogHeader className="gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
            <CalendarDays aria-hidden="true" className="size-5" strokeWidth={1.7} />
          </div>
          <div className="grid gap-2">
            <DialogTitle className="text-xl font-semibold text-content-strong">
              Vencimento da fatura
            </DialogTitle>
            <DialogDescription className="leading-6 text-content">
              Escolha o dia do mês em que o cartão vence. A nova data será usada nas próximas projeções.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="rounded-2xl border border-brand/20 bg-brand/[0.07] px-4 py-3">
          <p className="text-[0.65rem] font-semibold text-brand/80">
            Vencimento mensal
          </p>
          <p className="mt-1 flex items-baseline gap-2 text-content-strong">
            <span className="text-3xl font-semibold tracking-tight">{selectedDay}</span>
            <span className="text-sm text-content">de cada mês</span>
          </p>
        </div>

        <DayOfMonthGrid selectedDay={selectedDay} onSelectDay={setSelectedDay} />

        <p className="text-xs leading-5 text-content-subtle">
          Em meses mais curtos, o vencimento fica no último dia disponível.
        </p>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void saveDueDay()} disabled={isSaving || selectedDay === creditDueDay}>
            {isSaving ? "Salvando..." : "Salvar dia"}
          </Button>
        </DialogFooter>
      </DialogContent>
  );
}
