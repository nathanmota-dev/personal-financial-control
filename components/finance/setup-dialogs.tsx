"use client";

import { Landmark,Layers3,Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState,useTransition } from "react";
import { toast } from "sonner";
import { AccountSetupDialogDialogContent1 } from "./setup-dialogs-account-setup-dialog-dialog-content1";

import {
createAccountAction,
createCategoryAction,
updateAccountAction,
updateCategoryAction,
} from "@/app/actions/finance";
import { FinanceField } from "@/components/finance/finance-field";
import { FormSelect } from "@/components/finance/form-select";
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
import { SelectItem } from "@/components/ui/select";
import {
categoryGroupLabels,
extractErrorMessage,
moneyInputToCents
} from "@/lib/finance-ui";

import type {
AccountRow,
AccountSetupDialogProps,
CategoryRow,
CategorySetupDialogProps,
SetupCalloutProps,
} from "@/lib/interfaces/finance-fields";

export function AccountSetupDialog({
  account,
  trigger,
  commandId,
  defaultType,
}: AccountSetupDialogProps) {
  const router = useRouter();
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissedCommandId, setDismissedCommandId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const initialType = account?.type ?? defaultType ?? "checking";
  const open = manualOpen || Boolean(commandId && dismissedCommandId !== commandId);
  const [selectedAccountType, setSelectedAccountType] = useState<
    AccountRow["type"]
  >(initialType);

  function handleOpenChange(nextOpen: boolean) {
    setManualOpen(nextOpen);
    setSelectedAccountType(initialType);
    if (!nextOpen && commandId) setDismissedCommandId(commandId);
  }

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

      handleOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Landmark className="size-4" />
            Nova conta
          </Button>
        )}
      </DialogTrigger>
      <AccountSetupDialogDialogContent1 account={account} startTransition={startTransition} onSubmit={onSubmit} selectedAccountType={selectedAccountType} setSelectedAccountType={setSelectedAccountType} isPending={isPending} />
    </Dialog>
  );
}

export function CategorySetupDialog({
  category,
  trigger,
  commandId,
}: CategorySetupDialogProps) {
  const router = useRouter();
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissedCommandId, setDismissedCommandId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const open = manualOpen || Boolean(commandId && dismissedCommandId !== commandId);

  function handleOpenChange(nextOpen: boolean) {
    setManualOpen(nextOpen);
    if (!nextOpen && commandId) setDismissedCommandId(commandId);
  }

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

      handleOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
