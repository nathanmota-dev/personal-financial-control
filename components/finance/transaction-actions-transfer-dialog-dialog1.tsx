"use client";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";

import { FinanceField } from "@/components/finance/finance-field";
import { FormSelect } from "@/components/finance/form-select";
import { MoneyInput } from "@/components/finance/money-input";
import { SetupCallout } from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import {
Dialog,

DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import type { TransferDialogDialog1Props } from "@/lib/interfaces/render/transaction-actions-transfer-dialog-dialog1";

export function TransferDialogDialog1({ open, setOpen, canTransfer, startTransition, onSubmit, accounts, month, isPending }: TransferDialogDialog1Props) {
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
