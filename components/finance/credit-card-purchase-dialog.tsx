"use client";

import { DialogContent } from "@/components/finance/privacy/privacy-dialog-content";

import type { CreditCardPurchaseDialogProps } from "@/lib/interfaces/finance-fields";
import { Pencil,Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect,useId,useRef,useState,useTransition } from "react";
import { toast } from "sonner";
import { CreditCardPurchaseDialogForm1 } from "./credit-card-purchase-dialog-credit-card-purchase-dialog-form1";

import {
createCreditCardChargeAction,
updateCreditCardChargeAction,
} from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import {
Dialog,

DialogDescription,
DialogHeader,
DialogTitle,
DialogTrigger
} from "@/components/ui/dialog";

import { extractErrorMessage,moneyInputToCents } from "@/lib/finance-ui";

export function CreditCardPurchaseDialog({
  accountId,
  categories,
  month,
  disabled,
  charge,
  trigger,
  commandId,
}: CreditCardPurchaseDialogProps) {
  const defaultDate = charge?.purchaseDate ?? `${month}-01`;
  const purchaseDateFieldId = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(defaultDate);
  const [isPending, startTransition] = useTransition();
  const handledCommandId = useRef<string | null>(null);
  const isEditing = Boolean(charge);

  useEffect(() => {
    if (!commandId || handledCommandId.current === commandId) return;
    handledCommandId.current = commandId;
    setPurchaseDate(defaultDate);
    setOpen(true);
  }, [commandId, defaultDate]);

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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setPurchaseDate(defaultDate);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            disabled={disabled}
            variant={isEditing ? "outline" : "default"}
            size={isEditing ? "sm" : "default"}
          >
            {isEditing ? (
              <Pencil className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {isEditing ? "Editar" : "Nova compra"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar compra no cartão" : "Nova compra no cartão"}
          </DialogTitle>
          <DialogDescription>
            O fechamento do cartão define automaticamente em qual fatura cada
            parcela entra.
          </DialogDescription>
        </DialogHeader>
        {categories.length ? (
          <CreditCardPurchaseDialogForm1 startTransition={startTransition} onSubmit={onSubmit} defaultCategoryId={defaultCategoryId} categories={categories} purchaseDateFieldId={purchaseDateFieldId} purchaseDate={purchaseDate} setPurchaseDate={setPurchaseDate} charge={charge} isPending={isPending} isEditing={isEditing} />
        ) : (
          <p className="text-sm leading-6 text-content">
            Crie uma categoria de gasto fixo ou variável antes de lançar compras
            no cartão.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
