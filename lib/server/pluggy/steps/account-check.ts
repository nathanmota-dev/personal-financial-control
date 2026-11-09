import type { PluggyAccountSyncStep } from "@/lib/interfaces/pluggy";
import { invariant } from "@/lib/server/errors";

/** Fails only the link whose remote account disappeared, so the other accounts keep syncing. */
export const accountCheckStep: PluggyAccountSyncStep = {
  name: "account-check",
  scope: "account",
  async run(context, link, item) {
    const accounts = await context.remoteAccounts(item);
    invariant(accounts.some((account) => account.id === link.externalAccountId), "PLUGGY_ACCOUNT_NOT_FOUND", "A conta não foi encontrada na Pluggy.", 404);
    return { counts: { accountsChecked: 1 } };
  },
};
