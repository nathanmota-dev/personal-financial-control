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
import { extractErrorMessage } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { CreditCardNextInvoiceCardProps } from "@/lib/interfaces/credit-card-view";

export function CreditCardNextInvoiceCard({
  accountId,
  creditDueDay,
  nextInvoice,
}: CreditCardNextInvoiceCardProps) {
  const { formatCurrency } = useFinancialFormatter();
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
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="min-w-0">
            <span className="block text-xs text-content">Próxima fatura</span>
            <span className="mt-1 block text-[15px] font-semibold text-content-strong">
              {upcomingInvoice ? formatCurrency(upcomingInvoice.totalCents) : `Dia ${creditDueDay}`}
            </span>
            <span className="mt-0.5 block text-xs text-content-muted">
              {upcomingInvoice
                ? `Estimativa para ${upcomingInvoice.month.slice(5, 7)}/${upcomingInvoice.month.slice(0, 4)} · vence dia ${creditDueDay}`
                : `Sem parcelas futuras · vence dia ${creditDueDay}`}
            </span>
          </span>
          <PencilLine aria-hidden="true" className="size-4 shrink-0 text-content" />
        </button>
      </DialogTrigger>

      <CreditCardNextInvoiceCardDialogContent1 selectedDay={selectedDay} setSelectedDay={setSelectedDay} setOpen={setOpen} isSaving={isSaving} saveDueDay={saveDueDay} creditDueDay={creditDueDay} />
    </Dialog>
  );
}
