import { apiGuard } from "@/lib/auth/server";
import { privateRoute,rejectRouteMethod } from "@/lib/server/route-response";
import { z } from "zod";

import {
goalApiError,
noStoreJson,
okJson,
revalidateGoalViews,
} from "@/app/api/goals/_responses";
import {
allocateGoalFunds,
listGoalAllocations,
releaseGoalFunds,
} from "@/lib/server/goals";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allocationPayloadSchema = z.object({
  type: z.enum(["manual_allocation", "manual_release"]).default("manual_allocation"),
  amountCents: z.number().int().positive(),
  occurredOn: z.string().trim(),
  notes: z.string().trim().optional().nullable(),
});

async function handleGET(_request: Request, { params }: RouteContext) {
  const denied = await apiGuard(_request);
  if (denied) return denied;
  try {
    const { id } = await params;
    return noStoreJson(await listGoalAllocations(id));
  } catch (error) {
    return goalApiError(error, {
      code: "GOAL_ALLOCATIONS_ERROR",
      message: "Unable to load goal allocations.",
      invalidCode: "INVALID_GOAL_ALLOCATION_QUERY",
      invalidMessage: "Invalid goal allocation query parameters.",
    });
  }
}

async function handlePOST(request: Request, { params }: RouteContext) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = allocationPayloadSchema.parse(await request.json());
    const payload = {
      goalId: id,
      amountCents: body.amountCents,
      occurredOn: body.occurredOn,
      notes: body.notes ?? undefined,
    };
    const result =
      body.type === "manual_release"
        ? await releaseGoalFunds(payload)
        : await allocateGoalFunds(payload);
    revalidateGoalViews();

    return okJson(result, { status: 201 });
  } catch (error) {
    return goalApiError(error, {
      code: "GOAL_ALLOCATION_ERROR",
      message: "Unable to update goal allocation.",
      invalidCode: "INVALID_GOAL_ALLOCATION_PAYLOAD",
      invalidMessage: "Invalid goal allocation payload.",
    });
  }
}

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
