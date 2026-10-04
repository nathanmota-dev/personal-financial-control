
export interface InvestmentPortfolioSettingsDialog3Props {
  isReconcileOpen: boolean;
  setIsReconcileOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  reconciledBalance: string;
  setReconciledBalance: import("react").Dispatch<import("react").SetStateAction<string>>;
  reconciledDate: string;
  setReconciledDate: import("react").Dispatch<import("react").SetStateAction<string>>;
  isPending: boolean;
  startTransition: import("react").TransitionStartFunction;
  onReconcile: () => Promise<void>;
}
