"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteCreditCardChargeAction } from "@/app/actions/finance";
import { CreditCardPurchaseDialog } from "@/components/finance/credit-card-purchase-dialog";
import { Button } from "@/components/ui/button";
import type {
  CreditCardCategoryOption,
  CreditCardChargeForEdit,
} from "@/lib/interfaces/credit-card";
import { extractErrorMessage } from "@/lib/finance-ui";

export function CreditCardChargeActions({
  charge,
  accountId,
  categories,
  month,
}: {
  charge: CreditCardChargeForEdit;
  accountId: string;
  categories: CreditCardCategoryOption[];
  month: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function deleteCharge() {
    if (!window.confirm(`Excluir a compra “${charge.description}”?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteCreditCardChargeAction(charge.id);
        toast.success("Compra do cartão excluída.");
        router.refresh();
      } catch (error) {
        toast.error(extractErrorMessage(error));
      }
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <CreditCardPurchaseDialog
        accountId={accountId}
        categories={categories}
        month={month}
        charge={charge}
      />
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Excluir ${charge.description}`}
        disabled={isPending}
        onClick={deleteCharge}
        className="text-content-strong0 hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
