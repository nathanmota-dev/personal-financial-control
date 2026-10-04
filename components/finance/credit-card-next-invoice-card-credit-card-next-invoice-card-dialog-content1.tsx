"use client";

import { Button } from "@/components/ui/button";
import {
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle
} from "@/components/ui/dialog";
import type { CreditCardNextInvoiceCardDialogContent1Props } from "@/lib/interfaces/render/credit-card-next-invoice-card-credit-card-next-invoice-card-dialog-content1";
import { cn } from "@/lib/utils";
import { daysOfMonth } from "@/lib/utils/components/credit-card-next-invoice-card";
import { CalendarDays,Check } from "lucide-react";

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

        <div role="group" aria-label="Dias do mês" className="grid grid-cols-7 gap-1.5">
          {daysOfMonth.map((day) => {
            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                type="button"
                aria-label={`Dia ${day}`}
                aria-pressed={isSelected}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "relative flex h-10 items-center justify-center rounded-xl border text-sm font-medium tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
                  isSelected
                    ? "border-brand/40 bg-brand/15 text-brand"
                    : "border-transparent text-content hover:border-border hover:bg-card hover:text-content-strong"
                )}
              >
                {day}
                {isSelected ? <Check aria-hidden="true" className="absolute right-1 top-1 size-2.5" /> : null}
              </button>
            );
          })}
        </div>

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
