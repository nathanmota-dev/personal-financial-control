"use client";

import { useState, useSyncExternalStore } from "react";
import { createFinancialPrivacyStore } from "@/lib/financial-privacy";
import type { FinancialPrivacyProviderProps } from "@/lib/interfaces/financial-privacy";
import { FinancialPrivacyContext } from "./privacy-context";

export function FinancialPrivacyProvider({ demoMode, children }: FinancialPrivacyProviderProps) {
  const [store] = useState(() => createFinancialPrivacyStore(demoMode));
  const hidden = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return <FinancialPrivacyContext value={{ hidden, setHidden: store.setHidden }}>{children}</FinancialPrivacyContext>;
}
