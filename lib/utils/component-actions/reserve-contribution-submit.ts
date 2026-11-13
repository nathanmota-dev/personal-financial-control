import { setReserveMonthlyContributionAction } from "@/app/actions/finance";
import { extractErrorMessage } from "@/lib/finance-ui";
import type { ReserveContributionSubmitContext } from "@/lib/interfaces/components/reserve-contribution";
import { toast } from "sonner";

export async function ReserveContributionSubmit({ monthlyContributionCents, router }: ReserveContributionSubmitContext) {
  try {
    await setReserveMonthlyContributionAction({ monthlyContributionCents });
    toast.success(monthlyContributionCents === null ? "A projeção voltou a usar as recorrências da reserva." : "Aporte mensal da reserva salvo.");
    router.refresh();
  } catch (error) {
    toast.error(extractErrorMessage(error));
  }
}
