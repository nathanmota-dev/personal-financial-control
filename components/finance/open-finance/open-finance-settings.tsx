"use client";

import { OpenFinanceSetupNotice } from "@/components/finance/open-finance/open-finance-setup-notice";
import { OpenFinanceWorkspace } from "@/components/finance/open-finance/open-finance-workspace";
import type { OpenFinanceSettingsProps } from "@/lib/interfaces/components/open-finance";

export function OpenFinanceSettings({ configured, accounts, categories }: OpenFinanceSettingsProps) {
  return configured ? <OpenFinanceWorkspace accounts={accounts} categories={categories} /> : <OpenFinanceSetupNotice />;
}
