"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createCreditCardChargeAction,
  updateCreditCardChargeAction,
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
import { Textarea } from "@/components/ui/textarea";
import type {
  CreditCardCategoryOption,
  CreditCardChargeForEdit,
} from "@/lib/interfaces/credit-card";
import { extractErrorMessage, moneyInputToCents } from "@/lib/finance-ui";

function centsToInputValue(value: number) {
  return (value / 100).toFixed(2).replace(".", ",");
}

export function CreditCardPurchaseDialog({
  accountId,
  categories,
  month,
  disabled,
  charge,
  trigger,
}: {
  accountId: string;
  categories: CreditCardCategoryOption[];
  month: string;
  disabled?: boolean;
  charge?: CreditCardChargeForEdit;
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(charge);

  async function onSubmit(formData: FormData) {
    try {
      const payload = {
        accountId,
        categoryId: String(formData.get("categoryId")),
        description: String(formData.get("description")),
        notes: String(formData.get("notes") ?? ""),
        purchaseDate: String(formData.get("purchaseDate")),
        totalAmountCents: moneyInputToCents(String(formData.get("amount"))),
        installmentCount: Number(formData.get("installmentCount")),
        kind: charge?.kind ?? "purchase",
      };

      if (charge) {
        await updateCreditCardChargeAction({ id: charge.id, ...payload });
        toast.success("Compra do cartão atualizada.");
      } else {
        await createCreditCardChargeAction(payload);
        toast.success("Compra do cartão criada.");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  const defaultCategoryId = charge?.categoryId ?? categories[0]?.id;
  const defaultDate = charge?.purchaseDate ?? `${month}-01`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button disabled={disabled} variant={isEditing ? "outline" : "default"} size={isEditing ? "sm" : "default"}>
            {isEditing ? <Pencil className="size-4" /> : <Plus className="size-4" />}
            {isEditing ? "Editar" : "Nova compra"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-slate-700 bg-slate-950">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar compra no cartão" : "Nova compra no cartão"}</DialogTitle>
          <DialogDescription>
            O fechamento do cartão define automaticamente em qual fatura cada parcela entra.
          </DialogDescription>
        </DialogHeader>
        {categories.length ? (
          <form
            action={(formData) => startTransition(() => void onSubmit(formData))}
            className="grid gap-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <select
                name="categoryId"
                defaultValue={defaultCategoryId}
                className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input name="purchaseDate" type="date" defaultValue={defaultDate} />
              <Input
                name="amount"
                placeholder="0,00"
                defaultValue={charge ? centsToInputValue(charge.totalAmountCents) : ""}
              />
              <Input
                name="installmentCount"
                type="number"
                min="1"
                max="60"
                defaultValue={String(charge?.installmentCount ?? 1)}
                placeholder="Quantidade de parcelas"
              />
              <Input
                name="description"
                className="md:col-span-2"
                placeholder="Descrição da compra"
                defaultValue={charge?.description ?? ""}
              />
            </div>
            <Textarea name="notes" defaultValue={charge?.notes ?? ""} placeholder="Observações" />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar compra"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <p className="text-sm leading-6 text-slate-400">
            Crie uma categoria de gasto fixo ou variável antes de lançar compras no cartão.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
