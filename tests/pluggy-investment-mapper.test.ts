import { describe, expect, it } from "vitest";

import type { PluggyRemoteInvestment } from "@/lib/interfaces/pluggy";
import type { PluggyLocalHolding, PluggyMappedInvestment } from "@/lib/interfaces/pluggy-investments";
import { linkedHoldingsByAsset, suggestHolding, uniqueMatchCodes } from "@/lib/server/pluggy/investments/match-holdings";
import { classifyPluggyInvestment, mapPluggyInvestment } from "@/lib/server/pluggy/mappers/investment";

const remote = (overrides: Partial<PluggyRemoteInvestment> = {}): PluggyRemoteInvestment => ({ id: "remote-1", name: " CDB Banco ", type: "FIXED_INCOME", subtype: "CDB", balance: 1000.5, amount: 1100, date: "2026-07-16T00:00:00.000Z", issuer: " Banco Emissor ", status: "ACTIVE", ...overrides });
const map = (overrides?: Partial<PluggyRemoteInvestment>) => mapPluggyInvestment(remote(overrides), "2026-07-20");
const holding = (overrides: Partial<PluggyLocalHolding>) => ({ id: "h", name: "Outro", ticker: null, institutionName: null, externalProvider: null, externalAssetId: null, isArchived: false, ...overrides }) as PluggyLocalHolding;
const position = (overrides: Partial<PluggyMappedInvestment>) => ({ ...map(), matchCodes: [], ...overrides });

describe("Pluggy investment mapper", () => {
  it.each([
    ["FIXED_INCOME", "CDB", "fixed_income", "cdb"],
    ["FIXED_INCOME", "LCI", "fixed_income", "lci_lca"],
    ["FIXED_INCOME", "LCA", "fixed_income", "lci_lca"],
    ["FIXED_INCOME", "TREASURY", "fixed_income", "treasury"],
    ["FIXED_INCOME", "DEBENTURES", "fixed_income", "debenture"],
    ["FIXED_INCOME", "DEBENTURE", "fixed_income", "debenture"],
    ["FIXED_INCOME", "LF", "fixed_income", "other"],
    ["FIXED_INCOME", null, "fixed_income", "other"],
    ["SECURITY", "RETIREMENT", "funds", "investment_fund"],
    ["SECURITY", null, "other", "other"],
    ["MUTUAL_FUND", "STOCK_FUND", "funds", "investment_fund"],
    ["MUTUAL_FUND", "REAL_ESTATE_FUND", "real_estate", "real_estate_fund"],
    ["EQUITY", "STOCK", "equities", "stock"],
    ["EQUITY", "BDR", "equities", "stock"],
    ["EQUITY", "DERIVATIVES", "equities", "other"],
    ["EQUITY", "OPTION", "equities", "other"],
    ["EQUITY", "REAL_ESTATE_FUND", "real_estate", "real_estate_fund"],
    ["ETF", "ETF", "funds", "etf"],
    ["ETF", null, "funds", "etf"],
    ["COE", "STRUCTURED_NOTE", "other", "other"],
    ["NEW_PRODUCT", "NEW_SUBTYPE", "other", "other"],
    [null, null, "other", "other"],
  ])("classifies %s/%s", (type, subtype, assetClass, instrumentType) => {
    expect(classifyPluggyInvestment(type, subtype)).toEqual({ assetClass, instrumentType });
  });

  it("ignores case and padding in the classification", () => {
    expect(classifyPluggyInvestment(" fixed_income ", " cdb ")).toEqual({ assetClass: "fixed_income", instrumentType: "cdb" });
  });

  it("maps identity, institution and trimmed names, using only id as the external identifier", () => {
    expect(map({ code: "CODE", isin: "ISIN" })).toMatchObject({ externalAssetId: "remote-1", name: "CDB Banco", institutionName: "Banco Emissor", matchCodes: ["ISIN", "CODE"] });
  });

  it("uses the net balance, never the gross amount", () => {
    expect(map({ balance: 900, amount: 1000 }).currentValueCents).toBe(90000);
  });

  it.each([[1.005, 101], [1234.56, 123456], [0.1 + 0.2, 30], [0, 0]])("rounds %f to %i cents", (balance, cents) => {
    expect(map({ balance }).currentValueCents).toBe(cents);
  });

  it.each([
    ["a missing balance", { balance: null }],
    ["a negative balance", { balance: -1 }],
    ["another currency", { currencyCode: "USD" }],
  ])("reports no value for %s", (_label, overrides) => {
    expect(map(overrides).currentValueCents).toBeNull();
  });

  it("accepts an explicit BRL balance", () => {
    expect(map({ currencyCode: "brl" }).currentValueCents).toBe(100050);
  });

  it("reads the date as a UTC day, and dates an undated position with today", () => {
    expect(map({ date: "2026-07-16T00:00:00.000Z" }).valueAsOf).toBe("2026-07-16");
    expect(map({ date: null }).valueAsOf).toBe("2026-07-20");
    expect(map({ date: "not-a-date" }).valueAsOf).toBe("2026-07-20");
  });

  it("falls back on the code and then a generic name", () => {
    expect(map({ name: " ", code: " ABC " }).name).toBe("ABC");
    expect(map({ name: null, code: null }).name).toBe("Investimento");
    expect(map({ issuer: " " }).institutionName).toBeNull();
  });

  it("flags only a total withdrawal", () => {
    expect(map({ status: "TOTAL_WITHDRAWAL" }).withdrawn).toBe(true);
    expect(map({ status: " total_withdrawal " }).withdrawn).toBe(true);
    expect(map({ status: "ACTIVE" }).withdrawn).toBe(false);
    expect(map({ status: null }).withdrawn).toBe(false);
  });
});

describe("Pluggy investment matching", () => {
  it("resolves links by externalAssetId for this provider only", () => {
    const linked = holding({ id: "a", externalProvider: "pluggy", externalAssetId: "remote-1" });
    const foreign = holding({ id: "b", externalProvider: "other", externalAssetId: "remote-2" });
    const map = linkedHoldingsByAsset([linked, foreign, holding({ id: "c" })]);
    expect([...map.keys()]).toEqual(["remote-1"]);
    expect(map.get("remote-1")?.id).toBe("a");
  });

  it("suggests by a code that identifies one position, ahead of a name match", () => {
    const codes = uniqueMatchCodes([position({ matchCodes: ["BR0001"] }), position({ matchCodes: ["OTHER"] })]);
    const byTicker = holding({ id: "ticker", name: "Sem relação", ticker: "br0001" });
    const byName = holding({ id: "name", name: "CDB Banco" });
    expect(suggestHolding(position({ matchCodes: ["BR0001"] }), [byName, byTicker], codes)?.id).toBe("ticker");
  });

  it("ignores a code repeated across positions", () => {
    const repeated = [position({ matchCodes: ["SAME"] }), position({ matchCodes: ["SAME"] })];
    const codes = uniqueMatchCodes(repeated);
    expect(codes.size).toBe(0);
    expect(suggestHolding(repeated[0], [holding({ id: "ticker", ticker: "SAME" })], codes)).toBeNull();
  });

  it("prefers the exact name, then a partial one, and uses the institution to break ties", () => {
    const none = new Set<string>();
    const subject = position({ name: "CDB Pós Fixado", institutionName: "Banco Emissor" });
    const exact = holding({ id: "exact", name: "cdb pos  fixado" });
    const partial = holding({ id: "partial", name: "CDB Pós" });
    expect(suggestHolding(subject, [partial, exact], none)?.id).toBe("exact");
    const atBank = holding({ id: "bank", name: "CDB Pós", institutionName: "Banco" });
    expect(suggestHolding(subject, [partial, atBank], none)?.id).toBe("bank");
  });

  it("suggests nothing on a tie or without a match", () => {
    const none = new Set<string>();
    const subject = position({ name: "CDB", institutionName: null });
    expect(suggestHolding(subject, [holding({ id: "a", name: "CDB" }), holding({ id: "b", name: "cdb" })], none)).toBeNull();
    expect(suggestHolding(subject, [holding({ name: "Ações" })], none)).toBeNull();
    expect(suggestHolding(subject, [], none)).toBeNull();
  });
});
