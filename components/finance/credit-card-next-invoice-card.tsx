"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, PencilLine } from "lucide-react";
import { toast } from "sonner";

import { updateAccountAction } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CreditCardNextInvoiceCardProps } from "@/lib/interfaces/credit-card-view";
import { extractErrorMessage, formatCurrency } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const daysOfMonth = Array.from({ length: 31 }, (_, index) => index + 1);

export function CreditCardNextInvoiceCard({
  accountId,
  creditDueDay,
  nextInvoice,
}: CreditCardNextInvoiceCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(creditDueDay);
  const [isSaving, setIsSaving] = useState(false);
  const upcomingInvoice = nextInvoice?.entryCount ? nextInvoice : undefined;

  async function saveDueDay() {
    setIsSaving(true);

    try {
      await updateAccountAction({ id: accountId, creditDueDay: selectedDay });
      toast.success("Dia de vencimento atualizado.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setSelectedDay(creditDueDay);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Configurar vencimento da próxima fatura. Atualmente, dia ${creditDueDay}.`}
          className="group w-full cursor-pointer rounded-2xl border border-input/70 bg-surface/35 px-4 py-3.5 text-left outline-none transition-colors hover:border-brand/45 hover:bg-surface/60 focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/45"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-[0.16em] text-content-strong0">
              Próxima fatura
            </span>
            <PencilLine
              aria-hidden="true"
              className="size-3.5 text-content-subtle transition-colors group-hover:text-brand"
            />
          </span>
          <span className="mt-1 block font-heading text-2xl font-semibold text-brand">
            {upcomingInvoice ? formatCurrency(upcomingInvoice.totalCents) : `Dia ${creditDueDay}`}
          </span>
          <span className="mt-1 block text-xs text-content-strong0">
            {upcomingInvoice
              ? `Estimativa para ${upcomingInvoice.month.slice(5, 7)}/${upcomingInvoice.month.slice(0, 4)} · vence dia ${creditDueDay}`
              : `Sem parcelas futuras · vence dia ${creditDueDay}`}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md gap-5 border-border/90 bg-surface-raised p-5 sm:p-6">
        <DialogHeader className="gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
            <CalendarDays aria-hidden="true" className="size-5" strokeWidth={1.7} />
          </div>
          <div className="grid gap-2">
            <DialogTitle className="font-heading text-xl font-semibold text-content-strong">
              Vencimento da fatura
            </DialogTitle>
            <DialogDescription className="leading-6 text-content">
              Escolha o dia do mês em que o cartão vence. A nova data será usada nas próximas projeções.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="rounded-2xl border border-brand/20 bg-brand/[0.07] px-4 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand/80">
            Vencimento mensal
          </p>
          <p className="mt-1 flex items-baseline gap-2 text-content-strong">
            <span className="font-heading text-3xl font-semibold tracking-tight">{selectedDay}</span>
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
                    : "border-transparent text-content hover:border-border hover:bg-surface/70 hover:text-content-strong"
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
    </Dialog>
  );
}
