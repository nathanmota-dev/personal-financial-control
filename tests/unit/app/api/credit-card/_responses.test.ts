import { expect, it } from "vitest";
import { ZodError } from "zod";
import { creditCardApiError } from "@/app/api/credit-card/_responses";
import { DomainError } from "@/lib/server/errors";

it("maps domain, validation and unexpected credit errors", async () => {
  const domain = creditCardApiError(
    new DomainError("NO_CARD", "Missing card", 404),
    "fallback",
  );
  expect(domain.status).toBe(404);
  expect((await domain.json()).error).toEqual({
    code: "NO_CARD",
    message: "Missing card",
  });
  for (const issues of [
    [],
    [{ code: "custom" as const, path: [], message: "invalid" }],
  ]) {
    const response = creditCardApiError(new ZodError(issues), "fallback");
    expect(response.status).toBe(400);
    expect((await response.json()).error.message).toBe(
      issues.length ? "invalid" : "Invalid credit card payload.",
    );
  }
  const fallback = creditCardApiError("unexpected", "fallback");
  expect(fallback.status).toBe(500);
  expect((await fallback.json()).error.message).toBe("fallback");
});
