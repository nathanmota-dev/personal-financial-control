"use client";

import { PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCardNextInvoiceCardDialogContent1 } from "./credit-card-next-invoice-card-credit-card-next-invoice-card-dialog-content1";

import { updateAccountAction } from "@/app/actions/finance";
import {
Dialog,
DialogTrigger
} from "@/components/ui/dialog";
import { extractErrorMessage,formatCurrency } from "@/lib/finance-ui";
import type { CreditCardNextInvoiceCardProps } from "@/lib/interfaces/credit-card-view";

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
          className="group w-full cursor-pointer rounded-2xl border border-input/70 bg-muted/30 px-4 py-3.5 text-left outline-none transition-colors hover:border-brand/45 hover:bg-muted/30 focus-visible:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand/45"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-content">
              Próxima fatura
            </span>
            <PencilLine
              aria-hidden="true"
              className="size-3.5 text-content-subtle transition-colors group-hover:text-brand"
            />
          </span>
          <span className="mt-1 block text-2xl font-semibold text-brand">
            {upcomingInvoice ? formatCurrency(upcomingInvoice.totalCents) : `Dia ${creditDueDay}`}
          </span>
          <span className="mt-1 block text-xs text-content">
            {upcomingInvoice
              ? `Estimativa para ${upcomingInvoice.month.slice(5, 7)}/${upcomingInvoice.month.slice(0, 4)} · vence dia ${creditDueDay}`
              : `Sem parcelas futuras · vence dia ${creditDueDay}`}
          </span>
        </button>
      </DialogTrigger>

      <CreditCardNextInvoiceCardDialogContent1 selectedDay={selectedDay} setSelectedDay={setSelectedDay} setOpen={setOpen} isSaving={isSaving} saveDueDay={saveDueDay} creditDueDay={creditDueDay} />
    </Dialog>
  );
}
