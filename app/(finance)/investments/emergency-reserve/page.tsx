import { connection } from "next/server";

import { InvestmentsView } from "@/components/finance/investments-view";
import { EmergencyReserveComposition } from "@/components/finance/emergency-reserve-composition";
import {
  getInvestmentContributionHistory,
  getInvestmentProjection,
} from "@/lib/server/investments";
import { getEmergencyReserveComposition } from "@/lib/server/investment-operations";

export default async function EmergencyReservePage() {
  await connection();
  const [projection, contributionHistory, composition] = await Promise.all([
    getInvestmentProjection(),
    getInvestmentContributionHistory(),
    getEmergencyReserveComposition(),
  ]);

  return (
    <div className="space-y-6"><InvestmentsView
      key={`${projection?.updatedAt ?? "empty"}-${projection?.currentBalanceCents ?? 0}-${projection?.asOfDate ?? "none"}`}
      projection={projection}
      contributionHistory={contributionHistory}
    /><EmergencyReserveComposition composition={composition} /></div>
  );
}
