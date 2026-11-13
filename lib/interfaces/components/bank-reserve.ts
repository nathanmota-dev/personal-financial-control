import type { BankReserveSplit } from "@/lib/interfaces/bank-reserve";

export type BankReserveControlProps = { split: BankReserveSplit };

export type BankReserveDialogProps = {
  split: BankReserveSplit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type BankReserveShortcut = { label: string; cents: number };

export type BankReserveSubmitContext = {
  reserveCents: number;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  onDone: () => void;
};
