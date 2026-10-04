import {
goalApiError,
noStoreJson,
okJson,
revalidateGoalViews,
} from "@/app/api/goals/_responses";
import { apiGuard } from "@/lib/auth/server";
import { archiveGoal,getGoalDetails,updateGoal } from "@/lib/server/goals";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function handleGET(_request: Request, { params }: RouteContext) {
  const denied = await apiGuard(_request);
  if (denied) return denied;
  try {
    const { id } = await params;
    return noStoreJson(await getGoalDetails(id));
  } catch (error) {
    return goalApiError(error, {
      code: "GOAL_DETAIL_ERROR",
      message: "Unable to load financial goal.",
      invalidCode: "INVALID_GOAL_QUERY",
      invalidMessage: "Invalid financial goal query parameters.",
    });
  }
}

async function handlePATCH(request: Request, { params }: RouteContext) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const goal = await updateGoal({ ...body, id });
    revalidateGoalViews();

    return okJson(goal);
  } catch (error) {
    return goalApiError(error, {
      code: "GOAL_UPDATE_ERROR",
      message: "Unable to update financial goal.",
      invalidCode: "INVALID_GOAL_PAYLOAD",
      invalidMessage: "Invalid financial goal payload.",
    });
  }
}

async function handleDELETE(_request: Request, { params }: RouteContext) {
  const denied = await apiGuard(_request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const goal = await archiveGoal(id);
    revalidateGoalViews();

    return okJson(goal);
  } catch (error) {
    return goalApiError(error, {
      code: "GOAL_ARCHIVE_ERROR",
      message: "Unable to archive financial goal.",
      invalidCode: "INVALID_GOAL_PAYLOAD",
      invalidMessage: "Invalid financial goal payload.",
    });
  }
}

export const GET = privateRoute(handleGET);

export const PATCH = privateRoute(handlePATCH);

export const DELETE = privateRoute(handleDELETE);

export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
