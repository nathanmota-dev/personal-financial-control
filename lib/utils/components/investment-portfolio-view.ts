import {
defaultInvestmentPurposeColor
} from "@/lib/finance-ui";
import type {
AllocationFormState,
HoldingFormState,
InvestmentPortfolioViewProps,
PurposeFormState
} from "@/lib/interfaces/investment-portfolio";

export function emptyHoldingForm(
  dashboard: InvestmentPortfolioViewProps["dashboard"]
): HoldingFormState {
  return {
    name: "",
    ticker: "",
    institutionName: "",
    assetClass: dashboard.options.assetClasses[0]?.value ?? "other",
    instrumentType: dashboard.options.instrumentTypes[0]?.value ?? "other",
    currentValue: "",
    valueAsOf: todayDate(),
    notes: "",
  };
}

export function emptyPurposeForm(): PurposeFormState {
  return {
    name: "",
    targetAmount: "",
    color: defaultInvestmentPurposeColor,
    notes: "",
  };
}

export function emptyAllocationForm(
  dashboard: InvestmentPortfolioViewProps["dashboard"]
): AllocationFormState {
  return {
    holdingId: dashboard.holdings[0]?.id ?? "",
    purposeId: dashboard.purposes[0]?.id ?? "",
    amount: "",
    allocatedOn: todayDate(),
    notes: "",
  };
}

export function todayDate() {
  const date = new Date();

  return (
    String(date.getFullYear()) +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}
