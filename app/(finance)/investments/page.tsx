import { connection } from "next/server";

import { InvestmentOverviewView } from "@/components/finance/investment-overview-view";
import { getInvestmentOverview } from "@/lib/server/investment-operations";

export default async function InvestmentsPage() {
  await connection();

  const overview = await getInvestmentOverview();
  return <InvestmentOverviewView overview={overview} />;
}
