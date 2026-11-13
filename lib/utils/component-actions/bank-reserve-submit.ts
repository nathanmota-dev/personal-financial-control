import { setBankReserveAmountAction } from "@/app/actions/finance";
import { extractErrorMessage } from "@/lib/finance-ui";
import type { BankReserveSubmitContext } from "@/lib/interfaces/components/bank-reserve";
import { toast } from "sonner";

export async function BankReserveSubmit({ reserveCents, router, onDone }: BankReserveSubmitContext) {
  try {
    await setBankReserveAmountAction({ reserveAmountCents: reserveCents });
    toast.success("Reserva atualizada.");
    onDone();
    router.refresh();
  } catch (error) {
    toast.error(extractErrorMessage(error));
  }
}
