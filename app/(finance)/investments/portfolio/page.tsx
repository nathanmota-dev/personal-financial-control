import { connection } from "next/server";

import { OperationalPortfolioView } from "@/components/finance/operational-portfolio-view";
import { listLongTermInvestmentPositions } from "@/lib/server/investment-operations";

export default async function InvestmentPortfolioPage() {
  await connection();

  const positions = await listLongTermInvestmentPositions();
  return <OperationalPortfolioView positions={positions} />;
}
