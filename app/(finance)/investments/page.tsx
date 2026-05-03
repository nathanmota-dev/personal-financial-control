import { InvestmentsView } from "@/components/finance/investments-view";
import { getInvestmentProjection } from "@/lib/server/investments";

export default async function InvestmentsPage() {
  let projection: Awaited<ReturnType<typeof getInvestmentProjection>> | undefined;

  try {
    projection = await getInvestmentProjection();
  } catch {}

  return <InvestmentsView projection={projection ?? null} />;
}
