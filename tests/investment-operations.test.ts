import { afterEach, describe, expect, it } from "vitest";

import {
  createInvestmentOperation,
  createOperationalInvestmentAsset,
  getInvestmentAssetDetails,
  registerManualInvestmentQuote,
  updateManualInvestmentBalance,
} from "@/lib/server/investment-operations";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => Promise.all(cleanups.splice(0).map((cleanup) => cleanup())));

async function stock() {
  const test = await createTestDatabase();
  cleanups.push(test.cleanup);
  const asset = await createOperationalInvestmentAsset({
    name: "Empresa teste",
    ticker: "TEST3",
    assetClass: "equities",
    instrumentType: "stock",
    valuationMode: "market_quote",
  }, test.db);
  return { ...test, asset };
}

describe("operational investment portfolio", () => {
  it("calculates multiple buys, fractional quantities, fees, and the moving average", async () => {
    const { db, asset } = await stock();
    await createInvestmentOperation({ holdingId: asset.id, type: "buy", operatedOn: "2026-09-01", quantity: "10.5", grossAmountCents: 10000, feesCents: 100 }, db);
    await createInvestmentOperation({ holdingId: asset.id, type: "buy", operatedOn: "2026-09-02", quantity: "4.25", grossAmountCents: 5000, feesCents: 50 }, db);
    const detail = await getInvestmentAssetDetails(asset.id, db);
    expect(detail?.position).toMatchObject({ quantity: "14.75", costCents: 15150, averagePriceCents: 1027 });
  });

  it("calculates partial and total sales and rejects sales above the position", async () => {
    const { db, asset } = await stock();
    await createInvestmentOperation({ holdingId: asset.id, type: "buy", operatedOn: "2026-09-01", quantity: "10", grossAmountCents: 10000, feesCents: 0 }, db);
    await createInvestmentOperation({ holdingId: asset.id, type: "sell", operatedOn: "2026-09-02", quantity: "4", grossAmountCents: 5000, feesCents: 100 }, db);
    expect((await getInvestmentAssetDetails(asset.id, db))?.position).toMatchObject({ quantity: "6", costCents: 6000, realizedResultCents: 900 });
    await expect(createInvestmentOperation({ holdingId: asset.id, type: "sell", operatedOn: "2026-09-03", quantity: "7", grossAmountCents: 7000 }, db)).rejects.toMatchObject({ code: "INSUFFICIENT_POSITION" });
    await createInvestmentOperation({ holdingId: asset.id, type: "sell", operatedOn: "2026-09-04", quantity: "6", grossAmountCents: 7000 }, db);
    expect((await getInvestmentAssetDetails(asset.id, db))?.position).toMatchObject({ quantity: "0", costCents: 0, realizedResultCents: 1900 });
  });

  it("uses the latest manual quote to value market positions", async () => {
    const { db, asset } = await stock();
    await createInvestmentOperation({ holdingId: asset.id, type: "buy", operatedOn: "2026-09-01", quantity: "2.5", grossAmountCents: 2000 }, db);
    await registerManualInvestmentQuote({ holdingId: asset.id, quotedOn: "2026-09-03", unitPriceCents: 1200 }, db);
    const detail = await getInvestmentAssetDetails(asset.id, db);
    expect(detail?.currentValueCents).toBe(3000);
    expect(detail?.resultCents).toBe(1000);
  });

  it("tracks fixed-income applications, redemptions, and a manual balance independently", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const asset = await createOperationalInvestmentAsset({ name: "CDB", assetClass: "fixed_income", instrumentType: "cdb", valuationMode: "manual_balance" }, db);
    await createInvestmentOperation({ holdingId: asset.id, type: "application", operatedOn: "2026-09-01", quantity: "0", grossAmountCents: 100000 }, db);
    await createInvestmentOperation({ holdingId: asset.id, type: "redemption", operatedOn: "2026-09-10", quantity: "0", grossAmountCents: 25000 }, db);
    await updateManualInvestmentBalance({ holdingId: asset.id, currentValueCents: 79000, valueAsOf: "2026-09-20" }, db);
    const detail = await getInvestmentAssetDetails(asset.id, db);
    expect(detail?.position?.appliedCapitalCents).toBe(75000);
    expect(detail?.currentValueCents).toBe(79000);
  });

});
