import type {
AccountRow
} from "@/lib/interfaces/finance-fields";

export interface AccountSetupDialogDialogContent1Props {
  account: AccountRow | undefined;
  allowedTypes?: AccountRow["type"][];
  startTransition: import("react").TransitionStartFunction;
  onSubmit: (formData: FormData) => Promise<void>;
  selectedAccountType: "investment" | "checking" | "savings" | "cash" | "credit";
  setSelectedAccountType: import("react").Dispatch<import("react").SetStateAction<"investment" | "checking" | "savings" | "cash" | "credit">>;
  isPending: boolean;
}

export interface CategorySetupDialogContentProps {
  category: import("@/lib/interfaces/finance-fields").CategoryRow | undefined;
  isPending: boolean;
  selectedGroup: import("@/lib/interfaces/finance-fields").CategoryRow["group"];
  onGroupChange: (group: import("@/lib/interfaces/finance-fields").CategoryRow["group"]) => void;
  onNameChange: (name: string) => void;
  onSubmit: (formData: FormData) => void;
}
