"use server";

import { requireActionSession } from "@/lib/auth/server";
import type { FinanceActionResult } from "@/lib/interfaces/finance-actions";
import type { RecurringLinkCandidatesResult, SaveRecurringLinksInput } from "@/lib/interfaces/recurring-occurrences";
import { listRecurringLinkCandidates, saveRecurringLinks } from "@/lib/server/recurring";
import { actionError, runFinanceAction } from "./action-runtime";

/** A read: nothing changes, so no view is revalidated. */
export async function listRecurringLinkCandidatesAction(templateId: string, month: string): Promise<FinanceActionResult<RecurringLinkCandidatesResult>> {
  await requireActionSession();
  try {
    return { ok: true, data: await listRecurringLinkCandidates(templateId, month) };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
}

export async function saveRecurringLinksAction(input: SaveRecurringLinksInput) {
  await requireActionSession();
  return runFinanceAction(async () => {
    await saveRecurringLinks(input);
    return null;
  });
}
