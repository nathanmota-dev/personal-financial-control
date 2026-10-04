import {
investmentAssetClasses,
investmentHoldings,
investmentInstrumentTypes,
investmentPurposes
} from "@/lib/db/schema";
import {
investmentAssetClassLabels,
investmentInstrumentTypeLabels,
} from "@/lib/finance-ui";
import { getInvestmentProjection } from "@/lib/server/investments";
import { buildPortfolioPositionCards } from "@/lib/server/stages/build-portfolio-position-cards";
import { eq } from "drizzle-orm";
import { AllocationRow,buildPercentage,HoldingRow,maxIsoDate,PortfolioDb,resolveReadDb,sumAllocationAmounts } from "./validation";

export async function getInvestmentPortfolioDashboard(database?: PortfolioDb) {
  const db = await resolveReadDb(database);
  const [investmentProjection, holdingRows, purposeRows, allocationRows] = await Promise.all([
    getInvestmentProjection(db),
    db.query.investmentHoldings.findMany({
      where: eq(investmentHoldings.isArchived, false),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.investmentPurposes.findMany({
      where: eq(investmentPurposes.isArchived, false),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.investmentPurposeAllocations.findMany({
      orderBy: (table, { desc: orderDesc }) => [orderDesc(table.allocatedOn), orderDesc(table.createdAt)],
    }),
  ]);

  const totalRegisteredCents = holdingRows.reduce(
    (total, holding) => total + holding.currentValueCents,
    0
  );
  const totalAllocatedCents = sumAllocationAmounts(allocationRows);
  const globalBalanceCents = investmentProjection?.currentBalanceCents ?? null;
  const comparisonBalanceCents = globalBalanceCents ?? totalRegisteredCents;
  const unclassifiedCents = Math.max(comparisonBalanceCents - totalAllocatedCents, 0);
  const overAllocatedCents = globalBalanceCents !== null
    ? Math.max(totalAllocatedCents - globalBalanceCents, 0)
    : 0;
  const notRegisteredCents = globalBalanceCents !== null
    ? Math.max(globalBalanceCents - totalRegisteredCents, 0)
    : 0;
  const { registrationDifferenceCents, holdings, purposes, serializedAllocations } = buildPortfolioPositionCards({ globalBalanceCents, totalRegisteredCents, groupAllocations, allocationRows, holdingRows, purposeRows, comparisonBalanceCents });

  const distribution = buildDistribution(holdingRows, globalBalanceCents, notRegisteredCents);
  const lastValueAsOf = maxIsoDate(holdingRows.map((holding) => holding.valueAsOf));
  const lastUpdatedAt = maxIsoDate(
    [...holdingRows, ...purposeRows].map((row) => row.updatedAt.toISOString())
  );

  return {
    investmentProjection,
    globalBalanceCents,
    comparisonBalanceCents,
    totalRegisteredCents,
    totalHoldingsCents: totalRegisteredCents,
    totalAllocatedCents,
    unclassifiedCents,
    overAllocatedCents,
    notRegisteredCents,
    registrationDifferenceCents,
    lastValueAsOf,
    lastUpdatedAt,
    summary: {
      globalBalanceCents,
      investmentBalanceCents: globalBalanceCents ?? 0,
      totalRegisteredCents,
      totalAllocatedCents,
      unclassifiedCents,
      overAllocatedCents,
      notRegisteredCents,
      registrationDifferenceCents,
    },
    reconciliation: {
      state:
        registrationDifferenceCents === null
          ? "not_configured"
          : registrationDifferenceCents === 0
            ? "aligned"
            : registrationDifferenceCents > 0
              ? "registered_above_global"
              : "registered_below_global",
      differenceCents: registrationDifferenceCents,
    },
    holdings,
    purposes,
    allocations: serializedAllocations,
    purposeAllocations: serializedAllocations,
    distribution,
    assetClassDistribution: distribution,
    options: {
      assetClasses: investmentAssetClasses.map((value) => ({
        value,
        label: investmentAssetClassLabels[value],
      })),
      instrumentTypes: investmentInstrumentTypes.map((value) => ({
        value,
        label: investmentInstrumentTypeLabels[value],
      })),
    },
  };
}

export function groupAllocations(
  rows: AllocationRow[],
  key: "holdingId" | "purposeId"
) {
  const grouped = new Map<string, AllocationRow[]>();

  for (const row of rows) {
    const groupKey = row[key];
    const current = grouped.get(groupKey) ?? [];
    current.push(row);
    grouped.set(groupKey, current);
  }

  return grouped;
}

export function buildDistribution(
  holdings: HoldingRow[],
  globalBalanceCents: number | null,
  notRegisteredCents: number
) {
  const amounts = new Map<(typeof investmentAssetClasses)[number], number>();

  for (const holding of holdings) {
    amounts.set(
      holding.assetClass,
      (amounts.get(holding.assetClass) ?? 0) + holding.currentValueCents
    );
  }

  const denominatorCents = globalBalanceCents ?? holdings.reduce(
    (total, holding) => total + holding.currentValueCents,
    0
  );
  const distribution: Array<{
    assetClass: (typeof investmentAssetClasses)[number] | "not_registered";
    label: string;
    amountCents: number;
    percentage: number;
    color: string;
  }> = investmentAssetClasses
    .filter((assetClass) => (amounts.get(assetClass) ?? 0) > 0)
    .map((assetClass) => ({
      assetClass,
      label: investmentAssetClassLabels[assetClass],
      amountCents: amounts.get(assetClass) ?? 0,
      percentage: buildPercentage(amounts.get(assetClass) ?? 0, denominatorCents),
      color: assetClassColor(assetClass),
    }));

  if (notRegisteredCents > 0) {
    distribution.push({
      assetClass: "not_registered",
      label: "Não cadastrado",
      amountCents: notRegisteredCents,
      percentage: buildPercentage(notRegisteredCents, denominatorCents),
      color: "#f59e0b",
    });
  }

  return distribution;
}

export function assetClassColor(assetClass: (typeof investmentAssetClasses)[number]) {
  const colors: Record<(typeof investmentAssetClasses)[number], string> = {
    fixed_income: "#22d3ee",
    equities: "#38bdf8",
    funds: "#818cf8",
    real_estate: "#a78bfa",
    crypto: "#f59e0b",
    cash: "#2dd4bf",
    other: "#94a3b8",
  };

  return colors[assetClass];
}
