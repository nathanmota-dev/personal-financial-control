import { and, eq, inArray, lte } from "drizzle-orm";

import { transactions } from "@/lib/db/schema";
import type { InvestmentBenchmarkRates, InvestmentHistoryWithBenchmarks } from "@/lib/interfaces/investment-history";
import { buildInvestmentHistory } from "@/lib/investment-history";
import { getBenchmarkRates } from "@/lib/server/benchmarks";
import { getFinanceToday } from "@/lib/server/runtime";
import { Db, dbOrDefault } from "./validation";

const NO_BENCHMARKS: InvestmentBenchmarkRates = { cdi: null, ipca: null, ibov: null };

type HistoryOptions = { benchmarks?: typeof getBenchmarkRates };

/** Monthly history of every position, bank-linked or manual, with the indexes for the same months. */
export async function getInvestmentHistory(database?: Db, options: HistoryOptions = {}): Promise<InvestmentHistoryWithBenchmarks> {
  const db = await dbOrDefault(database);
  const today = getFinanceToday();
  const [holdings, snapshots, operations, movements] = await Promise.all([
    db.query.investmentHoldings.findMany({ columns: { id: true, externalAssetId: true, isArchived: true, currentValueCents: true } }),
    db.query.investmentPositionSnapshots.findMany({ columns: { holdingId: true, snapshotDate: true, currentValueCents: true } }),
    db.query.investmentOperations.findMany({ columns: { holdingId: true, type: true, operatedOn: true, grossAmountCents: true, feesCents: true } }),
    db.query.transactions.findMany({
      columns: { type: true, transactionDate: true, amountCents: true },
      where: and(inArray(transactions.type, ["investment_contribution", "investment_withdrawal"]), eq(transactions.status, "posted"), lte(transactions.transactionDate, today)),
    }),
  ]);
  const history = buildInvestmentHistory({
    holdings,
    snapshots,
    operations,
    transactions: movements.flatMap((row) => (row.type === "investment_contribution" || row.type === "investment_withdrawal" ? [{ ...row, type: row.type }] : [])),
    today,
  });
  // A single month has nothing to compare, so the indexes are not fetched.
  if (history.points.length < 2) return { ...history, benchmarks: NO_BENCHMARKS };
  const benchmarks = await (options.benchmarks ?? getBenchmarkRates)(history.points[0].month, today.slice(0, 7));
  return { ...history, benchmarks };
}
