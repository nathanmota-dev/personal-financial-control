
export interface TransferDialogDialog1Props {
  open: boolean;
  setOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  canTransfer: boolean;
  startTransition: import("react").TransitionStartFunction;
  onSubmit: (formData: FormData) => Promise<void>;
  accounts: import("@/lib/interfaces/transactions").TransactionAccountOption[];
  month: string;
  isPending: boolean;
}
