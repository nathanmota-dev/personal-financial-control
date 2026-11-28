import type { AppDb } from "@/lib/db";
import { investmentHoldings } from "@/lib/db/schema";
import type { PluggyMappedInvestment } from "@/lib/interfaces/pluggy-investments";
import { invariant } from "@/lib/server/errors";
import { PLUGGY_PROVIDER } from "./match-holdings";

type Writer = AppDb | Parameters<Parameters<AppDb["transaction"]>[0]>[0];

/** What the bank reports about the money put into a position. Refreshed on every sync. */
export function bankPurchase({ principalCents, purchasedOn }: Pick<PluggyMappedInvestment, "principalCents" | "purchasedOn">) {
  return { principalCents, purchasedOn };
}

/** One insert, so a holding can never exist without the link that keeps it from being created twice. */
export async function insertLinkedHolding(db: Writer, position: PluggyMappedInvestment) {
  const { name, institutionName, assetClass, instrumentType, currentValueCents, valueAsOf, externalAssetId } = position;
  invariant(currentValueCents !== null, "PLUGGY_INVESTMENT_WITHOUT_VALUE", "O banco não informou o saldo em reais deste investimento.");
  await db.insert(investmentHoldings).values({ name, institutionName, assetClass, instrumentType, currentValueCents, valueAsOf, externalProvider: PLUGGY_PROVIDER, externalAssetId, ...bankPurchase(position) });
}
