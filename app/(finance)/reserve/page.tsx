import { requirePageSession } from "@/lib/auth/server";
import { connection } from "next/server";

import { EmergencyReserveComposition } from "@/components/finance/emergency-reserve-composition";
import { InvestmentsView } from "@/components/finance/investments-view";
import { getEmergencyReserveComposition } from "@/lib/server/investment-operations";
import {
getInvestmentContributionHistory,
getInvestmentProjection,
} from "@/lib/server/investments";

export default async function EmergencyReservePage() {
  await requirePageSession();
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
