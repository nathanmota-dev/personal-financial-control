"use client";

import { createContext, useContext } from "react";
import { formatCurrency as currency } from "@/lib/finance-ui";
import { HIDDEN_FINANCIAL_VALUE } from "@/lib/financial-privacy";
import type { FinancialPrivacyState } from "@/lib/interfaces/financial-privacy";

export const FinancialPrivacyContext = createContext<FinancialPrivacyState>({
  hidden: false,
  setHidden: () => {},
});

export function useFinancialPrivacy() {
  return useContext(FinancialPrivacyContext);
}

export function useFinancialFormatter() {
  const { hidden } = useFinancialPrivacy();
  return {
    formatCurrency: (cents: number) => hidden ? HIDDEN_FINANCIAL_VALUE : currency(cents),
    protect: <T,>(value: T) => hidden ? HIDDEN_FINANCIAL_VALUE : value,
  };
}
