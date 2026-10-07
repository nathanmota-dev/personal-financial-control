import type { ReactNode } from "react";

export interface FinancialPrivacyState {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}

export interface FinancialPrivacyProviderProps {
  demoMode: boolean;
  children: ReactNode;
}

export interface FinancialPrivacyFormProps {
  children: ReactNode;
  dialog?: boolean;
}

export interface FinancialPrivacyToggleProps {
  compact?: boolean;
}
