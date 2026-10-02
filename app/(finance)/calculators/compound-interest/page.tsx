import { requirePageSession } from "@/lib/auth/server";
import { CompoundInterestCalculator } from "@/components/finance/calculators/compound-interest-calculator";

export default async function CompoundInterestPage() {
  await requirePageSession();
  return <CompoundInterestCalculator />;
}
