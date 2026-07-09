import { connection } from "next/server";

import { GoalsView } from "@/components/finance/goals-view";
import { getGoalsDashboard } from "@/lib/server/goals";

export default async function GoalsPage() {
  await connection();

  const dashboard = await getGoalsDashboard();

  return (
    <GoalsView
      key={`${dashboard.summary.totalAllocatedCents}-${dashboard.summary.freeReserveCents}-${dashboard.goals.length}-${dashboard.recentAllocations[0]?.id ?? "empty"}`}
      dashboard={dashboard}
    />
  );
}
