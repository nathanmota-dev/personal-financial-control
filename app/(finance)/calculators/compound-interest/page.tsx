import { CompoundInterestCalculator } from "@/components/finance/calculators/compound-interest-calculator";
import { requirePageSession } from "@/lib/auth/server";

export default async function CompoundInterestPage() {
  await requirePageSession();
  return <CompoundInterestCalculator />;
}
