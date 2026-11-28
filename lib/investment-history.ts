import type {
InvestmentBenchmarkKey,
InvestmentBenchmarkPoint,
InvestmentBenchmarkRates,
InvestmentHistory,
InvestmentHistoryHolding,
InvestmentHistoryInput,
InvestmentHistoryOperation,
InvestmentHistoryPeriod,
InvestmentHistoryPoint,
InvestmentHistorySnapshot,
InvestmentHistorySummary,
} from "@/lib/interfaces/investment-history";
import { addMonthsToMonth } from "@/lib/utils/finance-month";

export const INVESTMENT_BENCHMARK_KEYS: InvestmentBenchmarkKey[] = ["cdi", "ipca", "ibov"];

const PERIOD_MONTHS: Record<InvestmentHistoryPeriod, number> = { "12m": 12, "24m": 24, all: Number.POSITIVE_INFINITY };

export function listHistoryMonths(startMonth: string, endMonth: string) {
  const months: string[] = [];
  for (let month = startMonth; month <= endMonth; month = addMonthsToMonth(month, 1)) months.push(month);
  return months;
}

/** Money that entered (+) or left (−) the position. Fees are a cost, so they stay out of what left. */
function operationFlowCents(operation: InvestmentHistoryOperation) {
  if (operation.type === "buy" || operation.type === "application") return operation.grossAmountCents + operation.feesCents;
  if (operation.type === "sell" || operation.type === "redemption") return -(operation.grossAmountCents - operation.feesCents);
  return 0;
}

function groupSnapshots(snapshots: InvestmentHistorySnapshot[]) {
  const byHolding = new Map<string, InvestmentHistorySnapshot[]>();
  for (const snapshot of snapshots) byHolding.set(snapshot.holdingId, [...(byHolding.get(snapshot.holdingId) ?? []), snapshot]);
  for (const list of byHolding.values()) list.sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate));
  return byHolding;
}

/** Value of one position in each month: the last snapshot carried forward, the live value in the current month. */
function holdingValues(holding: InvestmentHistoryHolding | undefined, snapshots: InvestmentHistorySnapshot[], months: string[], todayMonth: string) {
  const lastMonth = snapshots.at(-1)?.snapshotDate.slice(0, 7);
  let index = -1;
  return months.map((month) => {
    while (index + 1 < snapshots.length && snapshots[index + 1].snapshotDate.slice(0, 7) <= month) index += 1;
    const active = holding && !holding.isArchived;
    if (active && month === todayMonth) return holding.currentValueCents;
    if (index < 0) return 0;
    // An archived position leaves the history after its last known value.
    if (!active && lastMonth && month > lastMonth) return 0;
    return snapshots[index].currentValueCents;
  });
}

function addTo(map: Map<string, number>, month: string, amountCents: number) {
  map.set(month, (map.get(month) ?? 0) + amountCents);
}

/**
 * Builds the monthly history of the positions. Bank-linked positions take their flows from the bank movements;
 * manual positions take them from their operations, or, without operations, from the value they started or ended with.
 */
export function buildInvestmentHistory(input: InvestmentHistoryInput): InvestmentHistory {
  const todayMonth = input.today.slice(0, 7);
  const snapshots = input.snapshots.filter((snapshot) => snapshot.snapshotDate <= input.today);
  const firstMonth = snapshots.map((snapshot) => snapshot.snapshotDate.slice(0, 7)).sort()[0];
  if (!firstMonth || firstMonth > todayMonth) return { points: [] };
  const months = listHistoryMonths(firstMonth, todayMonth);
  const holdings = new Map(input.holdings.map((holding) => [holding.id, holding]));
  const byHolding = groupSnapshots(snapshots);
  for (const holding of input.holdings) if (!holding.isArchived && !byHolding.has(holding.id)) byHolding.set(holding.id, []);

  const operationsByHolding = new Map<string, InvestmentHistoryOperation[]>();
  for (const operation of input.operations) operationsByHolding.set(operation.holdingId, [...(operationsByHolding.get(operation.holdingId) ?? []), operation]);

  const values = new Map<string, number[]>();
  const flows = new Map<string, number>();
  let linkedSince: string | null = null;
  for (const [holdingId, list] of byHolding) {
    const holding = holdings.get(holdingId);
    const series = holdingValues(holding, list, months, todayMonth);
    values.set(holdingId, series);
    if (holding?.externalAssetId) {
      const appearsAt = months[series.findIndex((value) => value > 0)];
      if (appearsAt && (!linkedSince || appearsAt < linkedSince)) linkedSince = appearsAt;
      continue;
    }
    const operations = operationsByHolding.get(holdingId) ?? [];
    if (operations.length) {
      for (const operation of operations) addTo(flows, operation.operatedOn.slice(0, 7), operationFlowCents(operation));
      continue;
    }
    // Without operations, money only shows as the position appearing or going away.
    series.forEach((value, index) => {
      const previous = index ? series[index - 1] : 0;
      if ((previous === 0) !== (value === 0)) addTo(flows, months[index], value - previous);
    });
  }
  for (const transaction of input.transactions) {
    const month = transaction.transactionDate.slice(0, 7);
    if (!linkedSince || month < linkedSince || transaction.transactionDate > input.today) continue;
    addTo(flows, month, transaction.type === "investment_contribution" ? transaction.amountCents : -transaction.amountCents);
  }

  const points: InvestmentHistoryPoint[] = [];
  months.forEach((month, index) => {
    const valueCents = [...values.values()].reduce((total, series) => total + series[index], 0);
    const previous = points.at(-1);
    if (!previous) {
      points.push({ month, valueCents, netFlowCents: 0, investedCents: valueCents, gainCents: 0, returnRate: 0, cumulativeRate: 0 });
      return;
    }
    const netFlowCents = flows.get(month) ?? 0;
    const gainCents = valueCents - previous.valueCents - netFlowCents;
    const base = previous.valueCents + netFlowCents / 2;
    const returnRate = base > 0 ? gainCents / base : 0;
    points.push({
      month,
      valueCents,
      netFlowCents,
      investedCents: previous.investedCents + netFlowCents,
      gainCents,
      returnRate,
      cumulativeRate: (1 + previous.cumulativeRate) * (1 + returnRate) - 1,
    });
  });
  return { points };
}

/** Keeps the last months of the period and restarts the invested amount and the returns from its first month. */
export function sliceInvestmentHistory(points: InvestmentHistoryPoint[], period: InvestmentHistoryPeriod) {
  const months = PERIOD_MONTHS[period];
  const window = Number.isFinite(months) ? points.slice(-(months + 1)) : points;
  const rebased: InvestmentHistoryPoint[] = [];
  for (const point of window) {
    const previous = rebased.at(-1);
    if (!previous) {
      rebased.push({ ...point, netFlowCents: 0, investedCents: point.valueCents, gainCents: 0, returnRate: 0, cumulativeRate: 0 });
      continue;
    }
    rebased.push({
      ...point,
      investedCents: previous.investedCents + point.netFlowCents,
      cumulativeRate: (1 + previous.cumulativeRate) * (1 + point.returnRate) - 1,
    });
  }
  return rebased;
}

export function summarizeInvestmentHistory(points: InvestmentHistoryPoint[]): InvestmentHistorySummary {
  const last = points.at(-1);
  const changes = points.slice(1);
  const best = changes.reduce<InvestmentHistoryPoint | null>((found, point) => (!found || point.gainCents > found.gainCents ? point : found), null);
  const worst = changes.reduce<InvestmentHistoryPoint | null>((found, point) => (!found || point.gainCents < found.gainCents ? point : found), null);
  const totalGainCents = changes.reduce((total, point) => total + point.gainCents, 0);
  return {
    valueCents: last?.valueCents ?? 0,
    investedCents: last?.investedCents ?? 0,
    gainCents: last ? last.valueCents - last.investedCents : 0,
    cumulativeRate: last?.cumulativeRate ?? 0,
    best,
    worst,
    averageGainCents: changes.length ? Math.round(totalGainCents / changes.length) : 0,
  };
}

/** Chains each index from the first month of the points, carrying the last value over months not published yet. */
export function buildBenchmarkPoints(points: InvestmentHistoryPoint[], benchmarks: InvestmentBenchmarkRates): InvestmentBenchmarkPoint[] {
  const cumulative: Record<InvestmentBenchmarkKey, number> = { cdi: 0, ipca: 0, ibov: 0 };
  return points.map((point, index) => {
    const row: InvestmentBenchmarkPoint = { month: point.month, portfolio: point.cumulativeRate, cdi: null, ipca: null, ibov: null };
    for (const key of INVESTMENT_BENCHMARK_KEYS) {
      const rates = benchmarks[key];
      if (!rates) continue;
      const rate = index ? rates[point.month] : undefined;
      if (rate !== undefined) cumulative[key] = (1 + cumulative[key]) * (1 + rate) - 1;
      row[key] = cumulative[key];
    }
    return row;
  });
}

/** The portfolio's cumulative return as a share of the CDI's, or `null` when the CDI did not grow. */
export function shareOfCdi(point: InvestmentBenchmarkPoint | undefined) {
  if (!point || point.cdi === null || point.cdi <= 0) return null;
  return point.portfolio / point.cdi;
}

export function availableBenchmarks(benchmarks: InvestmentBenchmarkRates) {
  return INVESTMENT_BENCHMARK_KEYS.filter((key) => benchmarks[key] !== null);
}
