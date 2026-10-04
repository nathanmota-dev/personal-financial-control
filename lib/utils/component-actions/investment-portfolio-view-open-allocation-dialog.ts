import {
centsToMoneyInput
} from "@/lib/finance-ui";
import type { InvestmentPortfolioViewOpenAllocationDialogContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-open-allocation-dialog";
import type {
InvestmentHoldingCard,
InvestmentPurposeCard
} from "@/lib/interfaces/investment-portfolio";
import { todayDate } from "@/lib/utils/components/investment-portfolio-view";
import { toast } from "sonner";

export function InvestmentPortfolioViewOpenAllocationDialog({ dashboard, setAllocationForm, setAllocationDialog, setAllocationAvailableCents }: InvestmentPortfolioViewOpenAllocationDialogContext, holding?: InvestmentHoldingCard, purpose?: InvestmentPurposeCard) {
    const firstHolding =
      holding ??
      (purpose
        ? dashboard.holdings.find(
            (item) => !item.allocations.some((allocation) => allocation.purposeId === purpose.id)
          )
        : undefined) ??
      dashboard.holdings[0];
    const firstPurpose =
      purpose ??
      (holding
        ? dashboard.purposes.find(
            (item) => !holding.allocations.some((allocation) => allocation.purposeId === item.id)
          )
        : undefined) ??
      dashboard.purposes[0];

    if (!firstHolding || !firstPurpose) {
      toast.error("Cadastre pelo menos um ativo e uma caixinha antes de alocar.");
      return;
    }

    const existingAllocation = dashboard.allocations.find(
      (allocation) =>
        allocation.holdingId === firstHolding.id && allocation.purposeId === firstPurpose.id
    );
    const selectedHolding = dashboard.holdings.find(
      (item) => item.id === (existingAllocation?.holdingId ?? firstHolding.id)
    );
    const selectedHoldingAllocations = selectedHolding?.allocations ?? [];
    const allocatedElsewhereCents = selectedHoldingAllocations
      .filter((allocation) => allocation.id !== existingAllocation?.id)
      .reduce((total, allocation) => total + allocation.amountCents, 0);
    const availableCents = Math.max(
      (selectedHolding?.currentValueCents ?? firstHolding.currentValueCents) -
        allocatedElsewhereCents,
      0
    );
    const allocationAmountCents =
      existingAllocation && existingAllocation.amountCents > 0
        ? existingAllocation.amountCents
        : availableCents;

    setAllocationForm({
      holdingId: existingAllocation?.holdingId ?? firstHolding.id,
      purposeId: existingAllocation?.purposeId ?? firstPurpose.id,
      amount: allocationAmountCents > 0 ? centsToMoneyInput(allocationAmountCents) : "",
      allocatedOn: existingAllocation?.allocatedOn ?? todayDate(),
      notes: existingAllocation?.notes ?? "",
    });
    setAllocationDialog(existingAllocation ? { existingAllocation } : {});
    setAllocationAvailableCents(availableCents);
  }
