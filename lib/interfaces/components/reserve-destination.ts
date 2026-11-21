import type { ReserveDestinationContribution } from "@/lib/interfaces/reserve-destination";

export type ReserveDestinationNoticeProps = { contributions: ReserveDestinationContribution[]; className?: string };

export type ReserveDestinationDialogProps = {
  contributions: ReserveDestinationContribution[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ReserveDestinationRowProps = { contribution: ReserveDestinationContribution };

export type ReserveDestinationSubmitContext = {
  transactionId: string;
  reserveCents: number;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
};

export type TransactionDestinationButtonProps = { transaction: import("@/lib/interfaces/transactions").TransactionRow };
