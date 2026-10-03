import { expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { routeDatabase } from "../../helpers/route";
import { getFinanceDatabase } from "@/lib/db";
import * as operations from "@/lib/server/investment-operations";
import { createInvestmentHolding } from "@/lib/server/investment-portfolio";
import {
  investmentHoldings,
  investmentPortfolio,
  investmentPurposeAllocations,
  investmentPurposes,
} from "@/lib/db/schema";

routeDatabase();
async function asset(
  type: "stock" | "cdb" = "stock",
  name = "Teste",
  ticker = type === "stock" ? "TEST3" : null,
) {
  return operations.createOperationalInvestmentAsset({
    name,
    type,
    ticker,
    assetClass: "other",
    instrumentType: "other",
    valuationMode: "manual_balance",
  });
}
const date = "2026-07-16";
it.each([
  "stock",
  "real_estate_fund",
  "etf",
  "treasury",
  "cdb",
  "lci",
  "lca",
] as const)(
  "persists the supported asset type %s and normalized metadata",
  async (type) => {
    const row = await operations.createOperationalInvestmentAsset({
      name: " Teste ",
      type,
      ticker:
        type === "stock" || type === "real_estate_fund" || type === "etf"
          ? `tst${type}`
          : null,
      institutionName: " Corretora ",
      notes: " Nota ",
      assetClass: "other",
      instrumentType: "other",
      valuationMode: "manual_balance",
    });
    expect(row.name).toBe("Teste");
    expect(row.institutionName).toBe("Corretora");
    expect(row.notes).toBe("Nota");
    expect(row.valuationMode).toBe(
      ["stock", "real_estate_fund", "etf"].includes(type)
        ? "market_quote"
        : "manual_balance",
    );
    expect((await operations.getInvestmentAssetDetails(row.id))?.id).toBe(
      row.id,
    );
  },
);
it.each(["-1", "1.123456789", "1,2", "NaN", ""])(
  "rejects invalid quantity %s",
  (value) => {
    expect(() => operations.quantityToUnits(value)).toThrow(
      "Use até oito casas",
    );
  },
);
it("round-trips scaled quantities without financial precision loss", () => {
  for (const value of ["0", "2", "1.00000001", "12345.12345678"]) {
    expect(operations.unitsToQuantity(operations.quantityToUnits(value))).toBe(
      value,
    );
  }
  expect(() => operations.quantityToUnits("90071993")).toThrow("muito alta");
});
it("requires quote symbols, rejects duplicates and prevents manual balance updates on quoted assets", async () => {
  const row = await asset();
  await expect(asset()).rejects.toMatchObject({
    code: "DUPLICATE_QUOTE_SYMBOL",
  });
  await expect(
    operations.createOperationalInvestmentAsset({
      name: "Sem ticker",
      assetClass: "equities",
      instrumentType: "stock",
      valuationMode: "market_quote",
    }),
  ).rejects.toMatchObject({ code: "QUOTE_SYMBOL_REQUIRED" });
  await expect(
    operations.updateManualInvestmentBalance({
      holdingId: row.id,
      currentValueCents: 500,
      valueAsOf: date,
    }),
  ).rejects.toMatchObject({ code: "QUOTE_VALUED_HOLDING" });
});
it("updates and deletes persisted operations and preserves the holding identity", async () => {
  const first = await asset(),
    second = await asset("stock", "Outra", "OTHER3");
  const operation = await operations.createInvestmentOperation({
    holdingId: first.id,
    type: "buy",
    quantity: "2",
    unitPriceCents: 1000,
    operatedOn: date,
    settledOn: date,
  });
  await operations.updateInvestmentOperation(operation.id, {
    holdingId: first.id,
    type: "buy",
    quantity: "3",
    unitPriceCents: 2000,
    feesCents: 50,
    operatedOn: date,
    settledOn: date,
    notes: "Corrigida",
  });
  let detail = await operations.getInvestmentAssetDetails(first.id);
  expect(detail?.position).toMatchObject({ quantity: "3", costCents: 6050 });
  expect(detail?.operations[0]).toMatchObject({
    settledOn: date,
    notes: "Corrigida",
  });
  await expect(
    operations.updateInvestmentOperation(operation.id, {
      holdingId: second.id,
      type: "buy",
      quantity: "1",
      unitPriceCents: 100,
      operatedOn: date,
    }),
  ).rejects.toMatchObject({ code: "OPERATION_HOLDING_IMMUTABLE" });
  await operations.deleteInvestmentOperation(operation.id);
  detail = await operations.getInvestmentAssetDetails(first.id);
  expect(detail?.operations).toEqual([]);
  expect(detail?.position).toBeNull();
  await expect(
    operations.deleteInvestmentOperation(operation.id),
  ).rejects.toMatchObject({ code: "INVESTMENT_OPERATION_NOT_FOUND" });
  await expect(
    operations.updateInvestmentOperation(operation.id, {
      holdingId: first.id,
      type: "buy",
      quantity: "1",
      unitPriceCents: 100,
      operatedOn: date,
    }),
  ).rejects.toMatchObject({ code: "INVESTMENT_OPERATION_NOT_FOUND" });
});
it("stores fixed-income terms and updates their existing record", async () => {
  const row = await asset("cdb");
  await operations.updateFixedIncomeTerms({
    holdingId: row.id,
    subtype: "cdb",
    issuer: " Banco ",
    indexer: "cdi",
    indexerPercentageBps: 11000,
    maturityDate: "2027-07-16",
    liquidity: " diária ",
  });
  await operations.updateFixedIncomeTerms({
    holdingId: row.id,
    subtype: "cdb",
    rateBps: 1200,
  });
  expect(
    (await operations.getInvestmentAssetDetails(row.id))?.terms,
  ).toMatchObject({ subtype: "cdb", rateBps: 1200 });
  const stock = await asset();
  await expect(
    operations.updateFixedIncomeTerms({ holdingId: stock.id, subtype: "cdb" }),
  ).rejects.toMatchObject({ code: "FIXED_INCOME_REQUIRED" });
});
it("locks asset type after operations and archives only a zeroed position", async () => {
  const row = await asset();
  await operations.updateOperationalInvestmentAsset(row.id, {
    name: "Atualizado",
    type: "etf",
    ticker: "NEW11",
    assetClass: "funds",
    instrumentType: "etf",
    valuationMode: "market_quote",
    notes: "nova",
  });
  await operations.createInvestmentOperation({
    holdingId: row.id,
    type: "buy",
    quantity: "1",
    unitPriceCents: 1000,
    operatedOn: date,
  });
  await expect(
    operations.updateOperationalInvestmentAsset(row.id, {
      name: "Alterado",
      type: "cdb",
      assetClass: "fixed_income",
      instrumentType: "cdb",
      valuationMode: "manual_balance",
    }),
  ).rejects.toMatchObject({ code: "ASSET_TYPE_LOCKED" });
  await expect(
    operations.archiveOperationalInvestmentAsset(row.id),
  ).rejects.toMatchObject({ code: "ACTIVE_POSITION" });
  await operations.createInvestmentOperation({
    holdingId: row.id,
    type: "sell",
    quantity: "1",
    unitPriceCents: 1100,
    operatedOn: date,
  });
  await operations.archiveOperationalInvestmentAsset(row.id);
  expect(await operations.getInvestmentAssetDetails(row.id)).toBeNull();
});
it.each(["stock", "cdb"] as const)(
  "converts legacy %s positions into an initial correction",
  async (type) => {
    const db = await getFinanceDatabase();
    const row = await createInvestmentHolding(
      {
        name: "Legado",
        assetClass: type === "cdb" ? "fixed_income" : "equities",
        instrumentType: type === "cdb" ? "cdb" : "stock",
        currentValueCents: 5000,
        valueAsOf: date,
        ticker: type === "stock" ? "LEG3" : null,
      },
      db,
    );
    await operations.convertLegacyInvestmentAsset(row.id, {
      type,
      initialCostCents: 4000,
      initialQuantity: "2",
      operatedOn: date,
    });
    const detail = await operations.getInvestmentAssetDetails(row.id);
    expect(detail?.position).toMatchObject({
      quantity: type === "stock" ? "2" : "0",
      costCents: 4000,
    });
    await expect(
      operations.convertLegacyInvestmentAsset(row.id, {
        type,
        initialCostCents: 5000,
        operatedOn: date,
      }),
    ).rejects.toMatchObject({ code: "ALREADY_OPERATIONAL" });
  },
);
it("reports updated quotes, cooldowns and stale data after provider failures", async () => {
  const row = await asset();
  await operations.createInvestmentOperation({
    holdingId: row.id,
    type: "buy",
    quantity: "2",
    unitPriceCents: 1000,
    operatedOn: date,
  });
  const provider = {
    name: "brapi" as const,
    getQuote: vi
      .fn()
      .mockResolvedValue({
        symbol: "TEST3",
        unitPriceCents: 1500,
        currency: "BRL",
        quotedAt: new Date("2026-07-16T12:00:00Z"),
        marketState: "regular",
      }),
  };
  const now = new Date("2026-07-16T12:00:00Z");
  expect(
    await operations.refreshInvestmentQuotes({
      provider,
      now,
      cooldownMinutes: 10,
    }),
  ).toMatchObject({ updated: 1, failed: 0 });
  expect(
    (await operations.getInvestmentAssetDetails(row.id))?.currentValueCents,
  ).toBe(3000);
  expect(
    await operations.refreshInvestmentQuotes({
      provider,
      now,
      cooldownMinutes: 10,
    }),
  ).toMatchObject({ updated: 0, skippedByCooldown: 1, snapshotDate: null });
  provider.getQuote.mockResolvedValueOnce({
    symbol: "TEST3",
    unitPriceCents: 1600,
    currency: "BRL",
    quotedAt: now,
    marketState: "regular",
  });
  expect(
    await operations.refreshInvestmentQuotes({
      provider,
      now,
      cooldownMinutes: 0,
    }),
  ).toMatchObject({ updated: 1 });
  provider.getQuote.mockRejectedValueOnce(new Error("Provider offline"));
  expect(
    await operations.refreshInvestmentQuotes({
      provider,
      now,
      cooldownMinutes: 0,
    }),
  ).toMatchObject({
    failed: 1,
    items: [expect.objectContaining({ message: "Provider offline" })],
  });
  expect(
    (await operations.getInvestmentAssetDetails(row.id))?.quotes[0].isStale,
  ).toBe(true);
  provider.getQuote.mockRejectedValueOnce("unknown");
  expect(
    await operations.refreshInvestmentQuotes({
      provider,
      now,
      cooldownMinutes: 0,
    }),
  ).toMatchObject({
    failed: 1,
    items: [expect.objectContaining({ message: "Falha desconhecida." })],
  });
});
it("rejects missing provider configuration and reports a legacy asset without a ticker", async () => {
  vi.stubEnv("BRAPI_API_TOKEN", undefined);
  await expect(operations.refreshInvestmentQuotes()).rejects.toMatchObject({
    code: "MARKET_DATA_NOT_CONFIGURED",
  });
  const row = await asset();
  const db = await getFinanceDatabase();
  await db
    .update(investmentHoldings)
    .set({ quoteSymbol: null, ticker: null })
    .where(eq(investmentHoldings.id, row.id));
  const provider = { name: "brapi" as const, getQuote: vi.fn() };
  expect(await operations.refreshInvestmentQuotes({ provider })).toMatchObject({
    failed: 1,
    items: [expect.objectContaining({ symbol: "—" })],
  });
  expect(provider.getQuote).not.toHaveBeenCalled();
});
it("separates reserve holdings, sums known portfolio cost and exposes persisted composition", async () => {
  const db = await getFinanceDatabase(),
    row = await asset("cdb");
  await operations.createInvestmentOperation({
    holdingId: row.id,
    type: "application",
    grossAmountCents: 10000,
    operatedOn: date,
  });
  await operations.updateManualInvestmentBalance({
    holdingId: row.id,
    currentValueCents: 11000,
    valueAsOf: date,
  });
  expect((await operations.getInvestmentOverview()).portfolioCents).toBe(11000);
  expect(
    (await operations.listLongTermInvestmentPositions())[0]
      .participationPercentage,
  ).toBe(100);
  const [purpose] = await db
    .insert(investmentPurposes)
    .values({ name: "Reserva", kind: "emergency_reserve", color: "#00ff00" })
    .returning();
  await db
    .insert(investmentPurposeAllocations)
    .values({
      holdingId: row.id,
      purposeId: purpose.id,
      amountCents: 11000,
      allocatedOn: date,
    });
  expect(await operations.listLongTermInvestmentPositions()).toEqual([]);
  expect(await operations.getEmergencyReserveComposition()).toMatchObject({
    registeredCents: 11000,
    holdings: [expect.objectContaining({ name: "Teste", amountCents: 11000 })],
  });
  await db.delete(investmentPortfolio);
  expect(await operations.getInvestmentOverview()).toMatchObject({
    totalCents: 0,
    reserve: { configured: false },
  });
});
