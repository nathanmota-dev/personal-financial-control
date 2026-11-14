import type { PendingReserveWithdrawal, ReserveWithdrawalChoice } from "@/lib/interfaces/reserve-withdrawal";

export type ReserveWithdrawalNoticeProps = { withdrawals: PendingReserveWithdrawal[] };

export type ReserveWithdrawalDialogProps = {
  withdrawals: PendingReserveWithdrawal[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ReserveWithdrawalRowProps = { withdrawal: PendingReserveWithdrawal };

export type ReserveWithdrawalSubmitContext = {
  transactionId: string;
  origin: ReserveWithdrawalChoice;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
};
