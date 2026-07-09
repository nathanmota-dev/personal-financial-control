import { z } from "zod";

import {
  goalApiError,
  okJson,
  revalidateGoalViews,
} from "@/app/api/goals/_responses";
import { createGoalContribution } from "@/lib/server/goals";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const contributionPayloadSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  transactionDate: z.string().trim(),
  notes: z.string().trim().optional().nullable(),
});

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = contributionPayloadSchema.parse(await request.json());
    const contribution = await createGoalContribution({
      ...body,
      goalId: id,
      notes: body.notes ?? undefined,
    });
    revalidateGoalViews();

    return okJson(contribution, { status: 201 });
  } catch (error) {
    return goalApiError(error, {
      code: "GOAL_CONTRIBUTION_ERROR",
      message: "Unable to create goal contribution.",
      invalidCode: "INVALID_GOAL_CONTRIBUTION_PAYLOAD",
      invalidMessage: "Invalid goal contribution payload.",
    });
  }
}
