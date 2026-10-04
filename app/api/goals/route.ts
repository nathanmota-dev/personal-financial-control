import {
goalApiError,
noStoreJson,
okJson,
revalidateGoalViews,
} from "@/app/api/goals/_responses";
import { apiGuard } from "@/lib/auth/server";
import { createGoal,getGoalsDashboard } from "@/lib/server/goals";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
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

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
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

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
