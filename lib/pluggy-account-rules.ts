import type { AccountType } from "@/lib/db/schema/types";
import type { PluggyAccountKind } from "@/lib/interfaces/pluggy";

/** A card must feed a credit account, and a bank account must feed a checking or savings account. */
export function isLinkableAccountType(kind: PluggyAccountKind, type: AccountType) {
  return kind === "credit" ? type === "credit" : type === "checking" || type === "savings";
}
