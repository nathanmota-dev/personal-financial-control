"use client";

import { PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCardNextInvoiceCardDialogContent1 } from "./credit-card-next-invoice-card-credit-card-next-invoice-card-dialog-content1";

import { FinanceMetric } from "@/components/finance/finance-metric";

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
          className="group min-w-0 cursor-pointer rounded-xl text-left outline-none transition-colors hover:ring-1 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FinanceMetric
            label="Próxima fatura"
            value={upcomingInvoice ? formatCurrency(upcomingInvoice.totalCents) : `Dia ${creditDueDay}`}
            description={upcomingInvoice
              ? `Estimativa para ${upcomingInvoice.month.slice(5, 7)}/${upcomingInvoice.month.slice(0, 4)} · vence dia ${creditDueDay}`
              : `Sem parcelas futuras · vence dia ${creditDueDay}`}
            icon={<PencilLine aria-hidden="true" />}
            className="h-full"
          />
        </button>
      </DialogTrigger>

      <CreditCardNextInvoiceCardDialogContent1 selectedDay={selectedDay} setSelectedDay={setSelectedDay} setOpen={setOpen} isSaving={isSaving} saveDueDay={saveDueDay} creditDueDay={creditDueDay} />
    </Dialog>
  );
}
