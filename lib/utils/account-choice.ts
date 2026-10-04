import type { AccountChoice } from "@/lib/interfaces/finance-utils";

export function isLiquidAccount(account: AccountChoice) {
  return ["checking", "savings", "cash"].includes(account.type);
}

export function selectAccountId(
  accounts: AccountChoice[],
  liquidOnly: boolean,
  currentAccountId?: string,
) {
  const available = liquidOnly ? accounts.filter(isLiquidAccount) : accounts;
  return available.find((account) => account.id === currentAccountId)?.id ?? available[0]?.id ?? "";
}
