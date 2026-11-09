import type { PluggyApi, PluggyItemRecord } from "@/lib/interfaces/pluggy";
import type { PluggyInvestmentRead } from "@/lib/interfaces/pluggy-investments";
import { DomainError } from "@/lib/server/errors";

/** Connectors expose different products, so an unreadable resource is reported instead of failing the connection. */
export async function readRemoteInvestments(client: PluggyApi, item: PluggyItemRecord): Promise<PluggyInvestmentRead> {
  try {
    return { positions: await client.listInvestments(item.externalItemId), error: null };
  } catch (error) {
    if (error instanceof DomainError) return { positions: [], error: error.message };
    throw error;
  }
}
