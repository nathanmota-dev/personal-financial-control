import type {
  Dispatch,
  SetStateAction,
} from "react";

import type { getInvestmentPortfolioDashboard } from "@/lib/server/investment-portfolio";

export type InvestmentPortfolioDashboard = Awaited<
  ReturnType<typeof getInvestmentPortfolioDashboard>
>;

export type InvestmentHoldingCard = InvestmentPortfolioDashboard["holdings"][number];
export type InvestmentPurposeCard = InvestmentPortfolioDashboard["purposes"][number];
export type InvestmentAllocationCard = InvestmentPortfolioDashboard["allocations"][number];
export type InvestmentHoldingAllocation = InvestmentHoldingCard["allocations"][number];
export type InvestmentDistributionItem = InvestmentPortfolioDashboard["distribution"][number];
export type InvestmentAssetClassOption = InvestmentPortfolioDashboard["options"]["assetClasses"][number];
export type InvestmentInstrumentTypeOption = InvestmentPortfolioDashboard["options"]["instrumentTypes"][number];
export type InvestmentAssetClass = InvestmentAssetClassOption["value"];
export type InvestmentInstrumentType = InvestmentInstrumentTypeOption["value"];

export type HoldingFormState = {
  name: string;
  ticker: string;
  institutionName: string;
  assetClass: InvestmentAssetClass;
  instrumentType: InvestmentInstrumentType;
  currentValue: string;
  valueAsOf: string;
  notes: string;
};

export type PurposeFormState = {
  name: string;
  targetAmount: string;
  color: string;
  notes: string;
};

export type AllocationFormState = {
  holdingId: string;
  purposeId: string;
  amount: string;
  allocatedOn: string;
  notes: string;
};

export type HoldingDialogState = {
  mode: "create" | "edit";
  holding?: InvestmentHoldingCard;
} | null;

export type PurposeDialogState = {
  mode: "create" | "edit";
  purpose?: InvestmentPurposeCard;
} | null;

export type AllocationDialogState = {
  existingAllocation?: InvestmentAllocationCard;
} | null;

export type PortfolioMutationAction =
  | "holding"
  | "purpose"
  | "allocation"
  | "archive-holding"
  | "archive-purpose"
  | "delete-allocation";

export type InvestmentPortfolioViewProps = {
  dashboard: InvestmentPortfolioDashboard;
};

export type PortfolioSummaryProps = {
  dashboard: InvestmentPortfolioDashboard;
};

export type SummaryMetricProps = {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: "cyan" | "sky" | "teal" | "amber";
};

export type ReconciliationAlertProps = {
  dashboard: InvestmentPortfolioDashboard;
};

export type PurposeCardsProps = {
  dashboard: InvestmentPortfolioDashboard;
  onCreate: () => void;
  onEdit: (purpose: InvestmentPurposeCard) => void;
  onAllocate: (purpose: InvestmentPurposeCard) => void;
  onArchive: (purpose: InvestmentPurposeCard) => void;
};

export type PurposeCardProps = {
  purpose: InvestmentPurposeCard;
  comparisonBalanceCents: number;
  onEdit: () => void;
  onAllocate: () => void;
  onArchive: () => void;
};

export type DistributionChartProps = {
  dashboard: InvestmentPortfolioDashboard;
};

export type HoldingsTableProps = {
  dashboard: InvestmentPortfolioDashboard;
  onCreate: () => void;
  onEdit: (holding: InvestmentHoldingCard) => void;
  onAllocate: (holding: InvestmentHoldingCard) => void;
  onEditAllocation: (allocation: InvestmentHoldingAllocation) => void;
  onArchive: (holding: InvestmentHoldingCard) => void;
};

export type HoldingDialogProps = {
  state: HoldingDialogState;
  form: HoldingFormState;
  setForm: Dispatch<SetStateAction<HoldingFormState>>;
  assetClasses: InvestmentAssetClassOption[];
  instrumentTypes: InvestmentInstrumentTypeOption[];
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export type PurposeDialogProps = {
  state: PurposeDialogState;
  form: PurposeFormState;
  setForm: Dispatch<SetStateAction<PurposeFormState>>;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

export type AllocationDialogProps = {
  state: AllocationDialogState;
  form: AllocationFormState;
  setForm: Dispatch<SetStateAction<AllocationFormState>>;
  holdings: InvestmentHoldingCard[];
  purposes: InvestmentPurposeCard[];
  availableCents: number;
  isExisting: boolean;
  isPending: boolean;
  onHoldingChange: (holdingId: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onDelete: () => void;
};

export type PortfolioFieldProps = {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
};

export type HoldingActionsProps = {
  holding: InvestmentHoldingCard;
  onEdit: () => void;
  onAllocate: () => void;
  onArchive: () => void;
};

export type HoldingMetricProps = {
  label: string;
  value: string;
};
