import { type FormEvent } from "react";

export interface ProjectionSimulationDialogForm1Props {
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  formId: string;
  description: string;
  setDescription: import("react").Dispatch<import("react").SetStateAction<string>>;
  amount: string;
  setAmount: import("react").Dispatch<import("react").SetStateAction<string>>;
  date: string;
  filters: import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState;
  setDate: import("react").Dispatch<import("react").SetStateAction<string>>;
  accountId: string;
  setAccountId: import("react").Dispatch<import("react").SetStateAction<string>>;
  accounts: import("@/app/interfaces/projected-balance").ProjectedBalanceAccountOption[];
  error: string | null;
  setOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
}
