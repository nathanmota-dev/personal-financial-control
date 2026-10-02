import { apiGuard } from "@/lib/auth/server";
import {
  goalApiError,
  noStoreJson,
  okJson,
  revalidateGoalViews,
} from "@/app/api/goals/_responses";
import { createGoal, getGoalsDashboard } from "@/lib/server/goals";

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

export async function GET(...args: Parameters<typeof handleGET>) {
  const response = await handleGET(...args);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(...args: Parameters<typeof handlePOST>) {
  const response = await handlePOST(...args);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function HEAD(request: Request) {
  const denied = await apiGuard(request);
  return denied ?? new Response(null, { status: 405, headers: { "Cache-Control": "private, no-store" } });
}
export async function OPTIONS(request: Request) {
  const denied = await apiGuard(request);
  return denied ?? new Response(null, { status: 405, headers: { "Cache-Control": "private, no-store" } });
}
