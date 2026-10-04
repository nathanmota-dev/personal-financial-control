
export interface HoldingDialogForm1Props {
  onSubmit: () => void;
  form: import("@/lib/interfaces/investment-portfolio").HoldingFormState;
  setForm: import("react").Dispatch<import("react").SetStateAction<import("@/lib/interfaces/investment-portfolio").HoldingFormState>>;
  assetClasses: { value: "other" | "cash" | "fixed_income" | "equities" | "funds" | "real_estate" | "crypto"; label: string; }[];
  instrumentTypes: { value: "other" | "cash" | "treasury" | "cdb" | "lci_lca" | "debenture" | "stock" | "etf" | "investment_fund" | "real_estate_fund" | "crypto_asset"; label: string; }[];
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  state: import("@/lib/interfaces/investment-portfolio").HoldingDialogState;
}
