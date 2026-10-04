"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState,useTransition } from "react";
import { toast } from "sonner";
import { TransferDialogDialog1 } from "./transaction-actions-transfer-dialog-dialog1";

import {
createTransferAction,
deleteTransactionAction,
} from "@/app/actions/finance";
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
import { extractErrorMessage,moneyInputToCents } from "@/lib/finance-ui";
import type {
DeleteTransactionDialogProps,
TransferDialogProps,
} from "@/lib/interfaces/transactions";

export function TransferDialog({ accounts, month }: TransferDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canTransfer = accounts.length >= 2;

  async function onSubmit(formData: FormData) {
    try {
      await createTransferAction({
        fromAccountId: String(formData.get("fromAccountId")),
        toAccountId: String(formData.get("toAccountId")),
        amountCents: moneyInputToCents(String(formData.get("amount"))),
        transferDate: String(formData.get("transferDate")),
        competenceMonth: String(formData.get("competenceMonth")),
        description: String(formData.get("description")),
      });
      toast.success("Transferência criada.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <TransferDialogDialog1 open={open} setOpen={setOpen} canTransfer={canTransfer} startTransition={startTransition} onSubmit={onSubmit} accounts={accounts} month={month} isPending={isPending} />
  );
}

export function DeleteTransactionDialog({ id }: DeleteTransactionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const result = await deleteTransactionAction(id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Lançamento removido.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Excluir lançamento"
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir lançamento</DialogTitle>
          <DialogDescription>
            Esta ação remove o registro em definitivo.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={onDelete}>
            {isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
