"use client";

import { Landmark, Layers3, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState,useTransition } from "react";
import { toast } from "sonner";
import { AccountSetupDialogDialogContent1 } from "./setup-dialogs-account-setup-dialog-dialog-content1";
import { CategorySetupDialogContent } from "./setup-dialogs-category-setup-dialog-content";

import {
createAccountAction,
createCategoryAction,
updateAccountAction,
updateCategoryAction,
} from "@/app/actions/finance";
import { findCatalogCategory } from "@/lib/category-markers";
import { Button } from "@/components/ui/button";
import {
Dialog,
DialogTrigger,
} from "@/components/ui/dialog";
import {
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
  allowedTypes,
}: AccountSetupDialogProps) {
  const router = useRouter();
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissedCommandId, setDismissedCommandId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const initialType = account?.type ?? defaultType ?? allowedTypes?.[0] ?? "checking";
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
          <Button variant="outline">
            <Landmark className="size-4" />
            Nova conta
          </Button>
        )}
      </DialogTrigger>
      <AccountSetupDialogDialogContent1 allowedTypes={allowedTypes} account={account} startTransition={startTransition} onSubmit={onSubmit} selectedAccountType={selectedAccountType} setSelectedAccountType={setSelectedAccountType} isPending={isPending} />
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
  const [selectedGroup, setSelectedGroup] = useState<CategoryRow["group"]>(category?.group ?? "variable_expense");
  const open = manualOpen || Boolean(commandId && dismissedCommandId !== commandId);

  function handleOpenChange(nextOpen: boolean) {
    setManualOpen(nextOpen);
    if (nextOpen) setSelectedGroup(category?.group ?? "variable_expense");
    if (!nextOpen && commandId) setDismissedCommandId(commandId);
  }

  function handleNameChange(name: string) {
    const entry = findCatalogCategory(name);
    if (entry && !category) setSelectedGroup(entry.group);
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
      <CategorySetupDialogContent
        category={category}
        isPending={isPending}
        selectedGroup={selectedGroup}
        onGroupChange={setSelectedGroup}
        onNameChange={handleNameChange}
        onSubmit={(formData) => startTransition(() => void onSubmit(formData))}
      />
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
