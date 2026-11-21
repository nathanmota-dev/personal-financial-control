import { requirePageSession } from "@/lib/auth/server";
import { connection } from "next/server";

import { EmergencyReserveComposition } from "@/components/finance/emergency-reserve-composition";
import { InvestmentsView } from "@/components/finance/investments-view";
import { getEmergencyReserveComposition } from "@/lib/server/investment-operations";
import {
getInvestmentContributionHistory,
getInvestmentProjection,
listReserveDestinations,
} from "@/lib/server/investments";

export default async function EmergencyReservePage() {
  await requirePageSession();
  await connection();
  const [projection, contributionHistory, composition, reserveDestinations] = await Promise.all([
    getInvestmentProjection(),
    getInvestmentContributionHistory(),
    getEmergencyReserveComposition(),
    listReserveDestinations(),
  ]);

  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5"><InvestmentsView
      key={`${projection?.updatedAt ?? "empty"}-${projection?.currentBalanceCents ?? 0}-${projection?.asOfDate ?? "none"}`}
      projection={projection}
      contributionHistory={contributionHistory}
      reserveDestinations={projection?.source === "bank" ? reserveDestinations : []}
    />{projection?.source === "bank" ? null : <EmergencyReserveComposition composition={composition} />}</div>
  );
}
