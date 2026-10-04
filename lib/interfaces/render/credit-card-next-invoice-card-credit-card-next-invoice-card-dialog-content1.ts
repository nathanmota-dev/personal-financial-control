
export interface CreditCardNextInvoiceCardDialogContent1Props {
  selectedDay: number;
  setSelectedDay: import("react").Dispatch<import("react").SetStateAction<number>>;
  setOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  isSaving: boolean;
  saveDueDay: () => Promise<void>;
  creditDueDay: number;
}
