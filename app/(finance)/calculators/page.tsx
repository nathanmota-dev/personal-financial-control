import { CalculatorsView } from "@/components/finance/calculators/calculators-view";
import { requirePageSession } from "@/lib/auth/server";

export default async function CalculatorsPage() {
  await requirePageSession();
  return <CalculatorsView />;
}
