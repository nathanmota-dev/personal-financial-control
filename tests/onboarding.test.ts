import { afterEach, describe, expect, it } from "vitest";
import { getOnboarding, updateOnboarding } from "@/lib/server/onboarding";
import { createTestDatabase } from "./helpers/database";
import { migrateDatabase } from "@/lib/db/migrate";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { await Promise.all(cleanups.splice(0).map(cleanup => cleanup())); });

describe("persistent onboarding", () => {
  it("starts pending, resumes progress and isolates Firebase UIDs", async () => {
    const { db, cleanup } = await createTestDatabase(); cleanups.push(cleanup);
    expect(await getOnboarding("a", db)).toEqual({ step: 1, completedAt: null });
    expect(await updateOnboarding("a", { step: 4 }, db)).toEqual({ step: 4, completedAt: null });
    await migrateDatabase(db.$client);
    expect(await getOnboarding("a", db)).toEqual({ step: 4, completedAt: null });
    expect(await getOnboarding("b", db)).toEqual({ step: 1, completedAt: null });
    await updateOnboarding("a", { step: 2 }, db);
    expect((await getOnboarding("a", db)).step).toBe(2);
  });
  it.each([1, 5])("permanently completes or skips from step %s", async step => {
    const { db, cleanup } = await createTestDatabase(); cleanups.push(cleanup);
    await updateOnboarding("a", { step }, db);
    const completed = await updateOnboarding("a", { completed: true }, db);
    expect(completed.completedAt).toMatch(/^\d{4}-/);
    expect(await updateOnboarding("a", { completed: true }, db)).toEqual(completed);
    expect(await updateOnboarding("a", { step: 3 }, db)).toEqual(completed);
    expect(await getOnboarding("b", db)).toEqual({ step: 1, completedAt: null });
  });
  it("serializes concurrent completion and delayed progress", async () => {
    const { db, cleanup } = await createTestDatabase(); cleanups.push(cleanup);
    await Promise.all([updateOnboarding("a", { step: 4 }, db), updateOnboarding("a", { completed: true }, db), updateOnboarding("a", { step: 1 }, db)]);
    const completed = await getOnboarding("a", db);
    expect(completed.completedAt).not.toBeNull();
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => updateOnboarding("a", i % 2 ? { step: 5 } : { completed: true }, db)));
    expect(results.every(result => JSON.stringify(result) === JSON.stringify(completed))).toBe(true);
  });
  it.each([{ step: 0 }, { step: 6 }, { step: 1.5 }, { completed: false }, { step: 2, completed: true }, { step: 2, userId: "other" }])("rejects invalid update %j", async input => {
    const { db, cleanup } = await createTestDatabase(); cleanups.push(cleanup);
    await expect(updateOnboarding("a", input as never, db)).rejects.toThrow();
    expect(await getOnboarding("a", db)).toEqual({ step: 1, completedAt: null });
  });
});
