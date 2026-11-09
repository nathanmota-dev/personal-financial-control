import { eq } from "drizzle-orm";

import { pluggyItems } from "@/lib/db/schema";
import type { PluggyItemSyncStep } from "@/lib/interfaces/pluggy";
import { remoteItemFields } from "@/lib/server/pluggy/remote";

/** Reads what Pluggy already collected. MeuPluggy items reject `PATCH /items/{id}`, so a refresh cannot be forced. */
export const itemStatusStep: PluggyItemSyncStep = {
  name: "item-status",
  scope: "item",
  async run(context, item) {
    const remote = await context.client.getItem(item.externalItemId);
    await context.write((db) => db.update(pluggyItems)
      .set({ ...remoteItemFields(remote), updatedAt: context.now })
      .where(eq(pluggyItems.id, item.id)));
    return { counts: { itemsChecked: 1 } };
  },
};
