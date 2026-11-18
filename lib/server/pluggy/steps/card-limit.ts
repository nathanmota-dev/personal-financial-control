import type { PluggyAccountSyncStep, PluggySyncStepResult } from "@/lib/interfaces/pluggy";
import { saveCreditCardLimit } from "@/lib/server/credit-card/limits";
import { remoteCardLimit } from "../remote";

/** Keeps the latest limit the bank reported for each linked card. */
export const syncCardLimitStep: PluggyAccountSyncStep = {
  name: "card-limit",
  scope: "account",
  async run(context, link, item): Promise<PluggySyncStepResult> {
    if (link.kind !== "credit") return;
    const remote = (await context.remoteAccounts(item)).find((account) => account.id === link.externalAccountId);
    const limit = remote ? remoteCardLimit(remote, context.now) : null;
    if (!limit) return { counts: { cardLimitsMissing: 1 } };
    await context.write((db) => saveCreditCardLimit(db, link.accountId, limit, context.now));
    return { counts: { cardLimits: 1 } };
  },
};
