import { requirePageSession } from "@/lib/auth/server";
import { CalculatorsView } from "@/components/finance/calculators/calculators-view";

export default async function CalculatorsPage() {
  await requirePageSession();
  return <CalculatorsView />;
}
