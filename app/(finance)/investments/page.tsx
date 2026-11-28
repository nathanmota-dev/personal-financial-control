import { requirePageSession } from "@/lib/auth/server";
import { connection } from "next/server";

import { InvestmentOverviewView } from "@/components/finance/investment-overview-view";
import { getInvestmentHistory, getInvestmentOverview } from "@/lib/server/investment-operations";

export default async function InvestmentsPage() {
  await requirePageSession();
  await connection();

  const [overview, history] = await Promise.all([getInvestmentOverview(), getInvestmentHistory()]);
  return <InvestmentOverviewView overview={overview} history={history} />;
}
