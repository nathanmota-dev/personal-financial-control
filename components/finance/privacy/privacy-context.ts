"use client";

import { createContext, createElement, useContext } from "react";
import type { ReactNode } from "react";
import { formatCurrency as currency } from "@/lib/finance-ui";
import { HIDDEN_FINANCIAL_VALUE } from "@/lib/financial-privacy";
import type { FinancialPrivacyState } from "@/lib/interfaces/financial-privacy";
import { HiddenFinancialValue } from "./hidden-financial-value";

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
    hidden,
    formatCurrency: (cents: number): ReactNode => hidden ? createElement(HiddenFinancialValue) : currency(cents),
    formatCurrencyText: (cents: number) => hidden ? HIDDEN_FINANCIAL_VALUE : currency(cents),
    protect: <T extends ReactNode,>(value: T): ReactNode => hidden ? createElement(HiddenFinancialValue) : value,
    protectText: (value: string) => hidden ? HIDDEN_FINANCIAL_VALUE : value,
  };
}
