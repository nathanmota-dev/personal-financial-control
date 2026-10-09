import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(120),
}).strict();
