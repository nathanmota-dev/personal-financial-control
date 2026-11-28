import { describe, expect, it } from "vitest";

import type { InvestmentHistoryInput } from "@/lib/interfaces/investment-history";
import {
availableBenchmarks,
buildBenchmarkPoints,
buildInvestmentHistory,
shareOfCdi,
sliceInvestmentHistory,
summarizeInvestmentHistory,
} from "@/lib/investment-history";

const base: InvestmentHistoryInput = { holdings: [], snapshots: [], operations: [], transactions: [], today: "2026-04-16" };
const manual = (id: string, currentValueCents: number, isArchived = false) => ({ id, externalAssetId: null, isArchived, currentValueCents });
const linked = (id: string, currentValueCents: number) => ({ id, externalAssetId: `remote-${id}`, isArchived: false, currentValueCents });
const snapshot = (holdingId: string, snapshotDate: string, currentValueCents: number) => ({ holdingId, snapshotDate, currentValueCents });

describe("investment history", () => {
  it("is empty without snapshots and with only future ones", () => {
    expect(buildInvestmentHistory(base).points).toEqual([]);
    expect(buildInvestmentHistory({ ...base, holdings: [manual("a", 100)], snapshots: [snapshot("a", "2026-05-01", 100)] }).points).toEqual([]);
  });

  it("carries the last value forward and uses the live value in the current month", () => {
    const { points } = buildInvestmentHistory({
      ...base,
      holdings: [manual("a", 10_500)],
      snapshots: [snapshot("a", "2026-01-31", 10_000), snapshot("a", "2026-02-28", 10_100)],
    });
    expect(points.map((point) => [point.month, point.valueCents])).toEqual([["2026-01", 10_000], ["2026-02", 10_100], ["2026-03", 10_100], ["2026-04", 10_500]]);
    expect(points[0]).toMatchObject({ investedCents: 10_000, gainCents: 0, returnRate: 0, cumulativeRate: 0 });
    expect(points[1]).toMatchObject({ gainCents: 100, returnRate: 0.01 });
    expect(points[3].cumulativeRate).toBeCloseTo(0.05, 10);
  });

  it("takes manual flows from operations, with fees as a cost, and ignores corrections", () => {
    const { points } = buildInvestmentHistory({
      ...base,
      holdings: [manual("a", 9_000)],
      snapshots: [snapshot("a", "2026-01-31", 10_000), snapshot("a", "2026-02-28", 15_200), snapshot("a", "2026-03-31", 9_000)],
      operations: [
        { holdingId: "a", type: "application", operatedOn: "2026-02-10", grossAmountCents: 5_000, feesCents: 0 },
        { holdingId: "a", type: "sell", operatedOn: "2026-03-10", grossAmountCents: 6_000, feesCents: 100 },
        { holdingId: "a", type: "correction", operatedOn: "2026-03-11", grossAmountCents: 999, feesCents: 0 },
      ],
      today: "2026-03-31",
    });
    expect(points[1]).toMatchObject({ netFlowCents: 5_000, investedCents: 15_000, gainCents: 200 });
    expect(points[1].returnRate).toBeCloseTo(200 / 12_500, 10);
    expect(points[2]).toMatchObject({ netFlowCents: -5_900, investedCents: 9_100, gainCents: -300 });
  });

  it("counts a manual position without operations as money in when it appears and money out when it is archived", () => {
    const { points } = buildInvestmentHistory({
      ...base,
      holdings: [manual("a", 10_200), manual("b", 0, true)],
      snapshots: [snapshot("a", "2026-01-31", 10_000), snapshot("b", "2026-02-28", 3_000), snapshot("a", "2026-03-31", 10_200)],
    });
    expect(points.map((point) => point.netFlowCents)).toEqual([0, 3_000, -3_000, 0]);
    expect(points.map((point) => point.gainCents)).toEqual([0, 0, 200, 0]);
  });

  it("uses bank movements only once a linked position exists and leaves the linked positions' operations out", () => {
    const { points } = buildInvestmentHistory({
      ...base,
      holdings: [linked("bank", 21_000)],
      snapshots: [snapshot("bank", "2026-03-05", 20_000)],
      operations: [{ holdingId: "bank", type: "buy", operatedOn: "2026-04-02", grossAmountCents: 500, feesCents: 0 }],
      transactions: [
        { type: "investment_contribution", transactionDate: "2026-02-10", amountCents: 7_000 },
        { type: "investment_contribution", transactionDate: "2026-04-03", amountCents: 1_000 },
        { type: "investment_withdrawal", transactionDate: "2026-04-05", amountCents: 200 },
        { type: "investment_contribution", transactionDate: "2026-04-20", amountCents: 9_999 },
      ],
    });
    expect(points.map((point) => point.month)).toEqual(["2026-03", "2026-04"]);
    expect(points[1]).toMatchObject({ netFlowCents: 800, gainCents: 200, investedCents: 20_800 });
  });

  it("keeps a holding without snapshots out of the past and adds it in the current month", () => {
    const { points } = buildInvestmentHistory({ ...base, holdings: [manual("a", 1_000), manual("b", 500)], snapshots: [snapshot("a", "2026-03-01", 1_000)] });
    expect(points.map((point) => point.valueCents)).toEqual([1_000, 1_500]);
    expect(points[1]).toMatchObject({ netFlowCents: 500, gainCents: 0 });
  });

  it("returns zero when there is nothing invested to earn on", () => {
    const { points } = buildInvestmentHistory({ ...base, holdings: [manual("a", 0)], snapshots: [snapshot("a", "2026-03-01", 0)] });
    expect(points[1]).toMatchObject({ gainCents: 0, returnRate: 0 });
  });
});

describe("investment history periods and summary", () => {
  const { points } = buildInvestmentHistory({
    ...base,
    holdings: [manual("a", 13_000)],
    snapshots: [snapshot("a", "2025-01-31", 10_000), snapshot("a", "2025-06-30", 11_000), snapshot("a", "2026-01-31", 12_000), snapshot("a", "2026-03-31", 11_800)],
  });

  it("rebases the invested amount and returns on the first month of the window", () => {
    const window = sliceInvestmentHistory(points, "12m");
    expect(window).toHaveLength(13);
    expect(window[0]).toMatchObject({ month: "2025-04", investedCents: 10_000, gainCents: 0, cumulativeRate: 0 });
    expect(sliceInvestmentHistory(points, "all")).toHaveLength(points.length);
    expect(sliceInvestmentHistory(points, "24m")).toHaveLength(points.length);
  });

  it("summarizes the best, worst and average month", () => {
    const summary = summarizeInvestmentHistory(sliceInvestmentHistory(points, "all"));
    expect(summary).toMatchObject({ valueCents: 13_000, investedCents: 10_000, gainCents: 3_000 });
    expect(summary.best).toMatchObject({ month: "2026-04", gainCents: 1_200 });
    expect(summary.worst).toMatchObject({ month: "2026-03", gainCents: -200 });
    expect(summary.averageGainCents).toBe(Math.round(3_000 / (points.length - 1)));
    expect(summarizeInvestmentHistory([])).toMatchObject({ valueCents: 0, best: null, worst: null, averageGainCents: 0 });
  });
});

describe("benchmark comparison", () => {
  const { points } = buildInvestmentHistory({ ...base, holdings: [manual("a", 10_200)], snapshots: [snapshot("a", "2026-02-28", 10_000), snapshot("a", "2026-03-31", 10_100)] });

  it("chains each index from the first month and carries unpublished months", () => {
    const rows = buildBenchmarkPoints(points, { cdi: { "2026-02": 0.5, "2026-03": 0.01, "2026-04": 0.01 }, ipca: { "2026-03": 0.005 }, ibov: null });
    expect(rows[0]).toEqual({ month: "2026-02", portfolio: 0, cdi: 0, ipca: 0, ibov: null });
    expect(rows[2].cdi).toBeCloseTo(1.01 * 1.01 - 1, 10);
    expect(rows[2].ipca).toBeCloseTo(0.005, 10);
    expect(rows[2].ibov).toBeNull();
    expect(shareOfCdi(rows[2])).toBeCloseTo(rows[2].portfolio / (rows[2].cdi ?? 1), 10);
  });

  it("has no share of the CDI without a positive CDI", () => {
    expect(shareOfCdi(undefined)).toBeNull();
    expect(shareOfCdi({ month: "2026-02", portfolio: 0.1, cdi: 0, ipca: null, ibov: null })).toBeNull();
    expect(shareOfCdi({ month: "2026-02", portfolio: 0.1, cdi: null, ipca: null, ibov: null })).toBeNull();
  });

  it("lists the indexes that could be read", () => {
    expect(availableBenchmarks({ cdi: {}, ipca: null, ibov: {} })).toEqual(["cdi", "ibov"]);
  });
});
