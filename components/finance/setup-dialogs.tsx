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
import {
  accountTypeLabels,
  categoryGroupLabels,
  centsToMoneyInput,
  extractErrorMessage,
  moneyInputToCents,
} from "@/lib/finance-ui";

type AccountRow = {
  id: string;
  name: string;
  type: "checking" | "savings" | "cash" | "credit" | "investment";
  initialBalanceCents: number;
};

type CategoryRow = {
  id: string;
  name: string;
  group: "income" | "fixed_expense" | "variable_expense" | "investment";
};

export function AccountSetupDialog({
  account,
  trigger,
}: {
  account?: AccountRow;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name")),
      type: String(formData.get("type")) as AccountRow["type"],
      initialBalanceCents: moneyInputToCents(String(formData.get("initialBalance"))),
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
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogDescription>Crie a base para lançamentos, transferências e recorrências.</DialogDescription>
        </DialogHeader>
        <form action={(formData) => startTransition(() => void onSubmit(formData))} className="grid gap-4">
          <Input name="name" defaultValue={account?.name ?? ""} placeholder="Nome da conta" />
          <select
            name="type"
            defaultValue={account?.type ?? "checking"}
            className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
          >
            {Object.entries(accountTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Input
            name="initialBalance"
            defaultValue={account ? centsToMoneyInput(account.initialBalanceCents) : "0,00"}
            placeholder="0,00"
          />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : account ? "Salvar alterações" : "Criar conta"}
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
}: {
  category?: CategoryRow;
  trigger?: React.ReactNode;
}) {
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
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>Escolha o grupo correto para combinar com os tipos de lançamento.</DialogDescription>
        </DialogHeader>
        <form action={(formData) => startTransition(() => void onSubmit(formData))} className="grid gap-4">
          <Input name="name" defaultValue={category?.name ?? ""} placeholder="Nome da categoria" />
          <select
            name="group"
            defaultValue={category?.group ?? "variable_expense"}
            className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
          >
            {Object.entries(categoryGroupLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : category ? "Salvar alterações" : "Criar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SetupCallout({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-sky-900/60 bg-sky-950/40 p-4 text-sm text-slate-300">
      <p className="font-medium text-slate-100">{title}</p>
      <p className="mt-1 leading-6 text-slate-400">{description}</p>
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
