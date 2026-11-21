import { classifyReserveDestinationAction } from "@/app/actions/finance";
import { extractErrorMessage } from "@/lib/finance-ui";
import type { ReserveDestinationSubmitContext } from "@/lib/interfaces/components/reserve-destination";
import { toast } from "sonner";

export async function ReserveDestinationSubmit({ transactionId, reserveCents, router }: ReserveDestinationSubmitContext) {
  try {
    await classifyReserveDestinationAction({ transactionId, reserveCents });
    toast.success(reserveCents > 0 ? "Destino salvo e reserva atualizada." : "Aporte registrado em investimentos.");
    router.refresh();
  } catch (error) {
    toast.error(extractErrorMessage(error));
  }
}
