import { expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import {
  goalApiError,
  noStoreJson,
  okJson,
  revalidateGoalViews,
} from "@/app/api/goals/_responses";
import { DomainError } from "@/lib/server/errors";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

it("revalidates every affected view and supports status and cache headers", async () => {
  revalidateGoalViews();
  expect(revalidatePath).toHaveBeenCalledTimes(6);
  expect(revalidatePath).toHaveBeenCalledWith("/goals");
  expect(await okJson({ amountCents: 100 }, { status: 201 }).json()).toEqual({
    ok: true,
    data: { amountCents: 100 },
  });
  expect(noStoreJson(null).headers.get("Cache-Control")).toBe("no-store");
});
it("preserves domain and validation details and chooses safe fallbacks", async () => {
  const fallback = {
    code: "FAILED",
    message: "fallback",
    invalidCode: "INVALID",
    invalidMessage: "invalid",
  };
  const domain = goalApiError(
    new DomainError("NOT_FOUND", "Missing", 404),
    fallback,
  );
  expect(domain.status).toBe(404);
  expect((await domain.json()).error.code).toBe("NOT_FOUND");
  const invalid = goalApiError(new ZodError([]), fallback);
  expect(invalid.status).toBe(400);
  expect((await invalid.json()).error).toEqual({
    code: "INVALID",
    message: "invalid",
    issues: [],
  });
  for (const [error, message] of [
    [new Error("offline"), "offline"],
    [new Error(""), "fallback"],
    ["unknown", "fallback"],
  ]) {
    const response = goalApiError(error, fallback);
    expect(response.status).toBe(500);
    expect((await response.json()).error.message).toBe(message);
  }
});
