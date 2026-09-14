"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createTransferAction,
  deleteTransactionAction,
} from "@/app/actions/finance";
import { SetupCallout } from "@/components/finance/setup-dialogs";
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
import { Input } from "@/components/ui/input";
import type {
  DeleteTransactionDialogProps,
  TransferDialogProps,
} from "@/lib/interfaces/transactions";
import { extractErrorMessage, moneyInputToCents } from "@/lib/finance-ui";

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Nova transferência</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferência entre contas</DialogTitle>
          <DialogDescription>Você precisa de pelo menos duas contas para esta operação.</DialogDescription>
        </DialogHeader>
        {canTransfer ? (
          <form action={(formData) => startTransition(() => void onSubmit(formData))} className="grid gap-4">
            <select name="fromAccountId" defaultValue={accounts[0]?.id} className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100">
              {accounts.map((account) => <option key={account.id} value={account.id}>Saída: {account.name}</option>)}
            </select>
            <select name="toAccountId" defaultValue={accounts[1]?.id ?? accounts[0]?.id} className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100">
              {accounts.map((account) => <option key={account.id} value={account.id}>Entrada: {account.name}</option>)}
            </select>
            <Input name="amount" placeholder="0,00" required />
            <Input name="transferDate" type="date" defaultValue={`${month}-01`} required />
            <Input name="competenceMonth" type="month" defaultValue={month} required />
            <Input name="description" placeholder="Descrição da transferência" required />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Criar transferência"}</Button>
            </DialogFooter>
          </form>
        ) : (
          <SetupCallout title="Transferência indisponível" description="Cadastre pelo menos duas contas para movimentar saldo entre origem e destino." />
        )}
      </DialogContent>
    </Dialog>
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
        <Button variant="destructive" size="icon-sm" aria-label="Excluir lançamento">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir lançamento</DialogTitle>
          <DialogDescription>Esta ação remove o registro em definitivo.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" disabled={isPending} onClick={onDelete}>
            {isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
