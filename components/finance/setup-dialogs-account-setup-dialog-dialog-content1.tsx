"use client";

import { FinanceField } from "@/components/finance/finance-field";
import { FormSelect } from "@/components/finance/form-select";
import { MoneyInput } from "@/components/finance/money-input";
import { Button } from "@/components/ui/button";
import {
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import {
accountTypeLabels,
centsToMoneyInput
} from "@/lib/finance-ui";
import type {
AccountRow
} from "@/lib/interfaces/finance-fields";
import type { AccountSetupDialogDialogContent1Props } from "@/lib/interfaces/render/setup-dialogs-account-setup-dialog-dialog-content1";

export function AccountSetupDialogDialogContent1({ account, startTransition, onSubmit, selectedAccountType, setSelectedAccountType, isPending }: AccountSetupDialogDialogContent1Props) {
  return (
<DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? "Editar conta" : "Nova conta"}</DialogTitle>
          <DialogDescription>
            Crie a base para lançamentos, transferências e recorrências.
          </DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => startTransition(() => void onSubmit(formData))}
          className="grid gap-4"
        >
          <FinanceField label="Nome">
            <Input
              name="name"
              defaultValue={account?.name ?? ""}
              placeholder="Nome da conta"
            />
          </FinanceField>
          <FinanceField label="Tipo de conta">
            <FormSelect
              name="type"
              value={selectedAccountType}
              onValueChange={(value) =>
                setSelectedAccountType(value as AccountRow["type"])
              }
            >
              {Object.entries(accountTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </FormSelect>
          </FinanceField>
          <FinanceField label="Saldo inicial (R$)">
            <MoneyInput
              name="initialBalance"
              defaultValue={
                account
                  ? centsToMoneyInput(account.initialBalanceCents)
                  : "0,00"
              }
              placeholder="0,00"
            />
          </FinanceField>
          {selectedAccountType === "credit" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FinanceField label="Dia do fechamento">
                <Input
                  name="creditClosingDay"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue={account?.creditClosingDay ?? ""}
                  placeholder="Dia do fechamento"
                />
              </FinanceField>
              <FinanceField label="Dia do vencimento">
                <Input
                  name="creditDueDay"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue={account?.creditDueDay ?? 10}
                  placeholder="Dia do vencimento"
                />
              </FinanceField>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Salvando..."
                : account
                  ? "Salvar alterações"
                  : "Criar conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
  );
}
