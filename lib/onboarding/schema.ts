import { z } from "zod";

export const onboardingUpdateSchema = z.union([
  z.object({ step: z.number().int().min(1).max(5) }).strict(),
  z.object({ completed: z.literal(true) }).strict(),
]);
export const onboardingStateSchema = z.object({
  step: z.number().int().min(1).max(5),
  completedAt: z.string().nullable(),
});
