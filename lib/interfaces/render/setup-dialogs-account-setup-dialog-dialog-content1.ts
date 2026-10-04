import type {
AccountRow
} from "@/lib/interfaces/finance-fields";

export interface AccountSetupDialogDialogContent1Props {
  account: AccountRow | undefined;
  startTransition: import("react").TransitionStartFunction;
  onSubmit: (formData: FormData) => Promise<void>;
  selectedAccountType: "investment" | "checking" | "savings" | "cash" | "credit";
  setSelectedAccountType: import("react").Dispatch<import("react").SetStateAction<"investment" | "checking" | "savings" | "cash" | "credit">>;
  isPending: boolean;
}
