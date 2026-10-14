import { IncomeCalculator } from "@/components/finance/calculators/income-calculator";
import { requirePageSession } from "@/lib/auth/server";
export default async function IncomePage() {
  await requirePageSession();
  return <IncomeCalculator pj />;
}
