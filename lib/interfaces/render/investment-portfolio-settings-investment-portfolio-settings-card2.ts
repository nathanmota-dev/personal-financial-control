
export interface InvestmentPortfolioSettingsCard2Props {
  projection: import("@/lib/interfaces/investments").InvestmentProjection;
  rate: string;
  setRate: import("react").Dispatch<import("react").SetStateAction<string>>;
  isPending: boolean;
  startTransition: import("react").TransitionStartFunction;
  onUpdateRate: () => Promise<void>;
  setReconciledBalance: import("react").Dispatch<import("react").SetStateAction<string>>;
  setReconciledDate: import("react").Dispatch<import("react").SetStateAction<string>>;
  setIsReconcileOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
}
