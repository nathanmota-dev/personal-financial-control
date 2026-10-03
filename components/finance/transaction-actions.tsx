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
import { FinanceField } from "@/components/finance/finance-field";
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
import { FormSelect } from "@/components/finance/form-select";
import { SelectItem } from "@/components/ui/select";
import { MoneyInput } from "@/components/finance/money-input";
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
      <DialogContent className="border border-border bg-card text-content-strong sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-xl font-semibold">
            Transferência entre contas
          </DialogTitle>
          <DialogDescription>
            Você precisa de pelo menos duas contas para esta operação.
          </DialogDescription>
        </DialogHeader>
        {canTransfer ? (
          <form
            action={(formData) =>
              startTransition(() => void onSubmit(formData))
            }
            className="grid gap-4"
          >
            <FinanceField label="Conta de origem">
              <FormSelect name="fromAccountId" defaultValue={accounts[0]?.id}>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    Saída: {account.name}
                  </SelectItem>
                ))}
              </FormSelect>
            </FinanceField>
            <FinanceField label="Conta de destino">
              <FormSelect
                name="toAccountId"
                defaultValue={accounts[1]?.id ?? accounts[0]?.id}
              >
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    Entrada: {account.name}
                  </SelectItem>
                ))}
              </FormSelect>
            </FinanceField>
            <FinanceField label="Valor (R$)">
              <MoneyInput name="amount" placeholder="0,00" required />
            </FinanceField>
            <FinanceField label="Data da transferência">
              <Input
                name="transferDate"
                type="date"
                defaultValue={`${month}-01`}
                required
              />
            </FinanceField>
            <FinanceField label="Mês de competência">
              <Input
                name="competenceMonth"
                type="month"
                defaultValue={month}
                required
              />
            </FinanceField>
            <FinanceField label="Descrição">
              <Input
                name="description"
                placeholder="Descrição da transferência"
                required
              />
            </FinanceField>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Criar transferência"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <SetupCallout
            title="Transferência indisponível"
            description="Cadastre pelo menos duas contas para movimentar saldo entre origem e destino."
          />
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
