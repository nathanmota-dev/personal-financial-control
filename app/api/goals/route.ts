import {
  goalApiError,
  noStoreJson,
  okJson,
  revalidateGoalViews,
} from "@/app/api/goals/_responses";
import { createGoal, getGoalsDashboard } from "@/lib/server/goals";

export async function GET() {
  try {
    return noStoreJson(await getGoalsDashboard());
  } catch (error) {
    return goalApiError(error, {
      code: "GOALS_DASHBOARD_ERROR",
      message: "Unable to load goals dashboard.",
      invalidCode: "INVALID_GOAL_QUERY",
      invalidMessage: "Invalid goals query parameters.",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const goal = await createGoal(body);
    revalidateGoalViews();

    return okJson(goal, { status: 201 });
  } catch (error) {
    return goalApiError(error, {
      code: "GOAL_CREATE_ERROR",
      message: "Unable to create financial goal.",
      invalidCode: "INVALID_GOAL_PAYLOAD",
      invalidMessage: "Invalid financial goal payload.",
    });
  }
}
