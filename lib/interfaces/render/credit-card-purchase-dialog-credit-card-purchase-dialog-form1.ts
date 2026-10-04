
export interface CreditCardPurchaseDialogForm1Props {
  startTransition: import("react").TransitionStartFunction;
  onSubmit: (formData: FormData) => Promise<void>;
  defaultCategoryId: string;
  categories: import("@/lib/interfaces/credit-card").CreditCardCategoryOption[];
  purchaseDateFieldId: string;
  purchaseDate: string;
  setPurchaseDate: import("react").Dispatch<import("react").SetStateAction<string>>;
  charge: import("@/lib/interfaces/credit-card").CreditCardChargeForEdit | undefined;
  isPending: boolean;
  isEditing: boolean;
}
