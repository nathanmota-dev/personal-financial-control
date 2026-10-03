"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Layers3, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createAccountAction,
  createCategoryAction,
  updateAccountAction,
  updateCategoryAction,
} from "@/app/actions/finance";
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
import {
  accountTypeLabels,
  categoryGroupLabels,
  centsToMoneyInput,
  extractErrorMessage,
  moneyInputToCents,
} from "@/lib/finance-ui";

import type {
  AccountRow,
  CategoryRow,
  AccountSetupDialogProps,
  CategorySetupDialogProps,
  SetupCalloutProps,
} from "@/lib/interfaces/finance-fields";

export function AccountSetupDialog({
  account,
  trigger,
}: AccountSetupDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedAccountType, setSelectedAccountType] = useState<
    AccountRow["type"]
  >(account?.type ?? "checking");

  async function onSubmit(formData: FormData) {
    const type = String(formData.get("type")) as AccountRow["type"];
    const creditClosingDay = String(
      formData.get("creditClosingDay") ?? "",
    ).trim();
    const creditDueDay = String(formData.get("creditDueDay") ?? "").trim();
    const payload = {
      name: String(formData.get("name")),
      type,
      initialBalanceCents: moneyInputToCents(
        String(formData.get("initialBalance")),
      ),
      creditClosingDay:
        type === "credit" && creditClosingDay
          ? Number(creditClosingDay)
          : undefined,
      creditDueDay:
        type === "credit" && creditDueDay ? Number(creditDueDay) : undefined,
    };

    try {
      if (account) {
        await updateAccountAction({ id: account.id, ...payload });
        toast.success("Conta atualizada.");
      } else {
        await createAccountAction(payload);
        toast.success("Conta criada.");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setSelectedAccountType(account?.type ?? "checking");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Landmark className="size-4" />
            Nova conta
          </Button>
        )}
      </DialogTrigger>
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
    </Dialog>
  );
}

export function CategorySetupDialog({
  category,
  trigger,
}: CategorySetupDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name")),
      group: String(formData.get("group")) as CategoryRow["group"],
    };

    try {
      if (category) {
        await updateCategoryAction({ id: category.id, ...payload });
        toast.success("Categoria atualizada.");
      } else {
        await createCategoryAction(payload);
        toast.success("Categoria criada.");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Layers3 className="size-4" />
            Nova categoria
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription>
            Escolha o grupo correto para combinar com os tipos de lançamento.
          </DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => startTransition(() => void onSubmit(formData))}
          className="grid gap-4"
        >
          <FinanceField label="Nome">
            <Input
              name="name"
              defaultValue={category?.name ?? ""}
              placeholder="Nome da categoria"
            />
          </FinanceField>
          <FinanceField label="Grupo">
            <FormSelect
              name="group"
              defaultValue={category?.group ?? "variable_expense"}
            >
              {Object.entries(categoryGroupLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </FormSelect>
          </FinanceField>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Salvando..."
                : category
                  ? "Salvar alterações"
                  : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SetupCallout({ title, description }: SetupCalloutProps) {
  return (
    <div className="rounded-2xl border border-brand/20 bg-brand-soft p-4 text-sm text-content">
      <p className="font-medium text-content-strong">{title}</p>
      <p className="mt-1 leading-6 text-content">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <AccountSetupDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Criar conta
            </Button>
          }
        />
        <CategorySetupDialog
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="size-4" />
              Criar categoria
            </Button>
          }
        />
      </div>
    </div>
  );
}
