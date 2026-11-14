import { classifyReserveWithdrawalAction } from "@/app/actions/finance";
import { extractErrorMessage } from "@/lib/finance-ui";
import type { ReserveWithdrawalSubmitContext } from "@/lib/interfaces/components/reserve-withdrawal";
import { toast } from "sonner";

export async function ReserveWithdrawalSubmit({ transactionId, origin, router }: ReserveWithdrawalSubmitContext) {
  try {
    await classifyReserveWithdrawalAction({ transactionId, origin });
    toast.success(origin === "reserve" ? "Retirada descontada da reserva." : "Retirada registrada na carteira.");
    router.refresh();
  } catch (error) {
    toast.error(extractErrorMessage(error));
  }
}
