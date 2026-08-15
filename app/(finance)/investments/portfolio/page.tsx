import { connection } from "next/server";

import { InvestmentPortfolioView } from "@/components/finance/investment-portfolio-view";
import { getInvestmentPortfolioDashboard } from "@/lib/server/investment-portfolio";

export default async function InvestmentPortfolioPage() {
  await connection();

  const dashboard = await getInvestmentPortfolioDashboard();

  return (
    <InvestmentPortfolioView
      key={
        String(dashboard.lastValueAsOf ?? "empty") +
        "-" +
        String(dashboard.totalRegisteredCents) +
        "-" +
        String(dashboard.totalAllocatedCents) +
        "-" +
        String(dashboard.holdings.length) +
        "-" +
        String(dashboard.purposes.length)
      }
      dashboard={dashboard}
    />
  );
}
