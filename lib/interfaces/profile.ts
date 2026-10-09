import type { z } from "zod";
import type { profileSchema } from "@/lib/auth/profile-schema";

export type ProfileInput = z.infer<typeof profileSchema>;

export interface AccountProfileField {
  id: keyof ProfileInput;
  label: string;
  maxLength: number;
}
