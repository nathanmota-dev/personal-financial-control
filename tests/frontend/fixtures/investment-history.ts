import { DEMO_REFERENCE_DATE } from "@/lib/demo/constants";
import { demoBenchmarkRates } from "@/lib/demo/fixture-data/benchmarks";
import { investmentHoldings } from "@/lib/demo/fixture-data/investment-holdings";
import { investmentPositionSnapshots } from "@/lib/demo/fixture-data/investment-position-snapshots";
import type { InvestmentHistoryWithBenchmarks } from "@/lib/interfaces/investment-history";
import { buildInvestmentHistory } from "@/lib/investment-history";

// The demo positions: twelve months of a CDB and a Treasury bond, with an ETF from January.
export const investmentHistoryFixture: InvestmentHistoryWithBenchmarks = {
  ...buildInvestmentHistory({
    holdings: investmentHoldings.map((holding) => ({ id: holding.id ?? "", externalAssetId: null, isArchived: false, currentValueCents: holding.currentValueCents })),
    snapshots: investmentPositionSnapshots.map((snapshot) => ({ holdingId: snapshot.holdingId, snapshotDate: snapshot.snapshotDate, currentValueCents: snapshot.currentValueCents })),
    operations: [],
    transactions: [],
    today: DEMO_REFERENCE_DATE,
  }),
  benchmarks: demoBenchmarkRates,
};
