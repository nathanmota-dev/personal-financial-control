
export interface HoldingDialogDiv1Props {
  form: import("@/lib/interfaces/investment-portfolio").HoldingFormState;
  setForm: import("react").Dispatch<import("react").SetStateAction<import("@/lib/interfaces/investment-portfolio").HoldingFormState>>;
  assetClasses: { value: "cash" | "other" | "fixed_income" | "equities" | "funds" | "real_estate" | "crypto"; label: string; }[];
  instrumentTypes: { value: "cash" | "other" | "treasury" | "cdb" | "lci_lca" | "debenture" | "stock" | "etf" | "investment_fund" | "real_estate_fund" | "crypto_asset"; label: string; }[];
}
