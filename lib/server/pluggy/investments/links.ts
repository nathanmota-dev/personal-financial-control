import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { investmentHoldings, pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteInvestment } from "@/lib/interfaces/pluggy";
import type { PluggyInvestmentNotice, PluggyInvestmentOverview, PluggyInvestmentView, PluggyLocalHolding, PluggyMappedInvestment } from "@/lib/interfaces/pluggy-investments";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import type { PluggyInvestmentLinkInput } from "../inputs";
import { mapPluggyInvestment } from "../mappers/investment";
import { linkedHoldingsByAsset, PLUGGY_PROVIDER, suggestHolding, uniqueMatchCodes } from "./match-holdings";
import { readRemoteInvestments } from "./read-positions";

type Transaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

const EMPTY_MESSAGE = "Este banco não informou investimentos. Mantenha essas posições manualmente.";

function positionView(item: { id: string; label: string }, position: PluggyMappedInvestment, linked: PluggyLocalHolding | undefined, suggested: PluggyLocalHolding | null): PluggyInvestmentView {
  const { externalAssetId, name, institutionName, currentValueCents, valueAsOf, withdrawn } = position;
  return {
    itemId: item.id, itemLabel: item.label, externalAssetId, name, institutionName, currentValueCents, valueAsOf, withdrawn,
    link: linked ? { holdingId: linked.id, holdingName: linked.name } : null,
    suggestedHoldingId: linked ? null : suggested?.id ?? null,
  };
}

function compareViews(left: PluggyInvestmentView, right: PluggyInvestmentView) {
  return left.itemLabel.localeCompare(right.itemLabel) || left.name.localeCompare(right.name) || left.externalAssetId.localeCompare(right.externalAssetId);
}

export async function getPluggyInvestmentOverview(db: AppDb, client: PluggyApi): Promise<PluggyInvestmentOverview> {
  const today = getFinanceToday();
  const [items, holdings] = await Promise.all([db.query.pluggyItems.findMany(), db.query.investmentHoldings.findMany()]);
  const reads = await Promise.all(items.map(async (item) => ({ item, ...await readRemoteInvestments(client, item) })));
  const notices: PluggyInvestmentNotice[] = reads.flatMap(({ item, positions, error }) => !positions.length ? [{ itemId: item.id, label: item.label, message: error ?? EMPTY_MESSAGE, failed: error !== null }] : []);
  const mapped = reads.flatMap(({ item, positions }) => positions.map((remote) => ({ item, position: mapPluggyInvestment(remote, today) })));
  const linked = linkedHoldingsByAsset(holdings);
  const free = holdings.filter((holding) => !holding.isArchived && !holding.externalAssetId);
  const uniqueCodes = uniqueMatchCodes(mapped.map(({ position }) => position));
  return {
    investments: mapped.map(({ item, position }) => positionView(item, position, linked.get(position.externalAssetId), suggestHolding(position, free, uniqueCodes))).sort(compareViews),
    holdings: free.map(({ id, name, institutionName }) => ({ id, name, institutionName })).sort((left, right) => left.name.localeCompare(right.name)),
    notices,
  };
}

async function findRemotePosition({ itemId, externalAssetId }: PluggyInvestmentLinkInput, db: AppDb, client: PluggyApi): Promise<PluggyRemoteInvestment> {
  const item = await db.query.pluggyItems.findFirst({ where: eq(pluggyItems.id, itemId) });
  invariant(item, "PLUGGY_ITEM_NOT_FOUND", "Conexão não encontrada.", 404);
  const remote = (await client.listInvestments(item.externalItemId)).find((position) => position.id === externalAssetId);
  invariant(remote, "PLUGGY_INVESTMENT_NOT_FOUND", "O investimento não pertence a esta conexão.", 404);
  return remote;
}

/** One insert, so a holding can never exist without the link that keeps it from being created twice. */
async function insertLinkedHolding(position: PluggyMappedInvestment, tx: Transaction) {
  const { name, institutionName, assetClass, instrumentType, currentValueCents, valueAsOf, externalAssetId } = position;
  invariant(currentValueCents !== null, "PLUGGY_INVESTMENT_WITHOUT_VALUE", "O banco não informou o saldo em reais deste investimento.");
  await tx.insert(investmentHoldings).values({ name, institutionName, assetClass, instrumentType, currentValueCents, valueAsOf, externalProvider: PLUGGY_PROVIDER, externalAssetId });
}

async function claimHolding(holdingId: string, holdings: PluggyLocalHolding[], externalAssetId: string, tx: Transaction) {
  const holding = holdings.find((row) => row.id === holdingId);
  invariant(holding && !holding.isArchived, "INVESTMENT_HOLDING_NOT_FOUND", "Ativo não encontrado.", 404);
  invariant(!holding.externalAssetId, "PLUGGY_HOLDING_ALREADY_LINKED", "Este ativo já está vinculado a outro investimento.", 409);
  await tx.update(investmentHoldings)
    .set({ externalProvider: PLUGGY_PROVIDER, externalAssetId, updatedAt: currentTimestamp() })
    .where(eq(investmentHoldings.id, holdingId));
}

/** Without `holdingId`, the holding is created here, in the same transaction that claims the remote position. */
export async function linkPluggyInvestment(input: PluggyInvestmentLinkInput, db: AppDb, client: PluggyApi) {
  const position = mapPluggyInvestment(await findRemotePosition(input, db, client), getFinanceToday());
  await db.transaction(async (tx) => {
    const holdings = await tx.query.investmentHoldings.findMany();
    invariant(!linkedHoldingsByAsset(holdings).has(position.externalAssetId), "PLUGGY_INVESTMENT_LINK_EXISTS", "Este investimento já está vinculado.", 409);
    if (input.holdingId) await claimHolding(input.holdingId, holdings, position.externalAssetId, tx);
    else await insertLinkedHolding(position, tx);
  });
}

export async function unlinkPluggyInvestment(holdingId: string, db: AppDb) {
  const updated = await db.update(investmentHoldings)
    .set({ externalProvider: null, externalAssetId: null, updatedAt: currentTimestamp() })
    .where(eq(investmentHoldings.id, holdingId))
    .returning();
  invariant(updated.length, "INVESTMENT_HOLDING_NOT_FOUND", "Ativo não encontrado.", 404);
}
