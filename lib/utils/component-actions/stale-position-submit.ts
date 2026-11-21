import { retireStalePositionAction } from "@/app/actions/finance";
import { extractErrorMessage } from "@/lib/finance-ui";
import type { StalePositionSubmitContext } from "@/lib/interfaces/components/stale-positions";
import { toast } from "sonner";

export async function StalePositionSubmit({ holdingId, router }: StalePositionSubmitContext) {
  try {
    await retireStalePositionAction({ holdingId });
    toast.success("Posição retirada do total investido.");
    router.refresh();
  } catch (error) {
    toast.error(extractErrorMessage(error));
  }
}
