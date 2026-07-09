import {
  goalApiError,
  noStoreJson,
  okJson,
  revalidateGoalViews,
} from "@/app/api/goals/_responses";
import { archiveGoal, getGoalDetails, updateGoal } from "@/lib/server/goals";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
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

export async function PATCH(request: Request, { params }: RouteContext) {
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

export async function DELETE(_request: Request, { params }: RouteContext) {
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
