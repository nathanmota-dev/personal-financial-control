import { eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { getDatabase, type AppDb } from "@/lib/db";
import { userOnboarding } from "@/lib/db/user-schema";
import type { OnboardingState, OnboardingUpdate } from "@/lib/interfaces/onboarding";
import { onboardingUpdateSchema } from "@/lib/onboarding/schema";

export async function getOnboarding(userId: string, database: AppDb = getDatabase()): Promise<OnboardingState> {
  // Session metadata uses plain columns, outside the encrypted finance adapter.
  const db = drizzle({ client: database.$client });
  const [row] = await db.select().from(userOnboarding).where(eq(userOnboarding.userId, userId));
  return { step: row?.currentStep ?? 1, completedAt: row?.completedAt ?? null };
}

export async function updateOnboarding(userId: string, input: OnboardingUpdate, database: AppDb = getDatabase()): Promise<OnboardingState> {
  const update = onboardingUpdateSchema.parse(input);
  const db = drizzle({ client: database.$client });
  const values = "completed" in update
    ? { completedAt: new Date().toISOString() }
    : { currentStep: update.step };
  // A single conditional upsert serializes completion against late progress writes.
  await db.insert(userOnboarding).values({ userId, ...values }).onConflictDoUpdate({
    target: userOnboarding.userId,
    set: values,
    setWhere: isNull(userOnboarding.completedAt),
  });
  return getOnboarding(userId, database);
}
