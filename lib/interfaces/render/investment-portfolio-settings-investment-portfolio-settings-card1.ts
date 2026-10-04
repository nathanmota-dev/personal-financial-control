
export interface InvestmentPortfolioSettingsCard1Props {
  initialBalance: string;
  setInitialBalance: import("react").Dispatch<import("react").SetStateAction<string>>;
  initialDate: string;
  setInitialDate: import("react").Dispatch<import("react").SetStateAction<string>>;
  rate: string;
  setRate: import("react").Dispatch<import("react").SetStateAction<string>>;
  isPending: boolean;
  startTransition: import("react").TransitionStartFunction;
  onConfigure: () => Promise<void>;
}
