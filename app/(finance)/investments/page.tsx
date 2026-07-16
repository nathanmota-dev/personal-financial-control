import { connection } from "next/server";

import { InvestmentsView } from "@/components/finance/investments-view";
import {
  getInvestmentContributionHistory,
  getInvestmentProjection,
} from "@/lib/server/investments";

export default async function InvestmentsPage() {
  await connection();

  const [projection, contributionHistory] = await Promise.all([
    getInvestmentProjection(),
    getInvestmentContributionHistory(),
  ]);

  return (
    <InvestmentsView
      key={`${projection?.updatedAt ?? "empty"}-${projection?.currentBalanceCents ?? 0}-${projection?.asOfDate ?? "none"}`}
      projection={projection}
      contributionHistory={contributionHistory}
    />
  );
}
