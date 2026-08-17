import type { ReactNode } from "react";

export const investmentReductionSourceTypes = [
  "allocation",
  "holding_free",
  "not_registered",
] as const;

export type InvestmentReductionSourceType =
  (typeof investmentReductionSourceTypes)[number];

export type InvestmentReductionSelection = {
  sourceId: string;
  amountCents: number;
};

export type InvestmentReductionSource = {
  id: string;
  sourceType: InvestmentReductionSourceType;
  label: string;
  description: string;
  availableCents: number;
  holdingId: string | null;
  holdingName: string | null;
  allocationId: string | null;
  purposeId: string | null;
  purposeName: string | null;
  purposeColor: string | null;
};

export type InvestmentReductionSourcesResult = {
  currentBalanceCents: number;
  checkpointDate: string | null;
  totalAvailableCents: number;
  sources: InvestmentReductionSource[];
  previousSelections: InvestmentReductionSelection[];
};

export type InvestmentReductionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  amountCents: number;
  sources: InvestmentReductionSource[];
  initialSelections?: InvestmentReductionSelection[];
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selections: InvestmentReductionSelection[]) => void;
  onCancel?: () => void;
  confirmLabel?: string;
  footerNote?: ReactNode;
};
