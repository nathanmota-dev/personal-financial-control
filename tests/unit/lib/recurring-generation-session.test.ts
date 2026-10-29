import { beforeEach, describe, expect, it } from "vitest";

import {
  claimRecurringGeneration,
  finishRecurringGeneration,
  resetRecurringGeneration,
} from "@/lib/recurring-generation-session";

describe("recurring generation session", () => {
  beforeEach(() => {
    resetRecurringGeneration();
  });

  it("claims each month once until it is generated", () => {
    const claim = claimRecurringGeneration("2026-05");

    expect(claim).not.toBeNull();
    expect(claimRecurringGeneration("2026-05")).toBeNull();
    expect(claimRecurringGeneration("2026-06")).not.toBeNull();

    finishRecurringGeneration("2026-05", claim!, true);

    expect(claimRecurringGeneration("2026-05")).toBeNull();
  });

  it("allows a retry after a failed generation", () => {
    const claim = claimRecurringGeneration("2026-05");
    finishRecurringGeneration("2026-05", claim!, false);

    expect(claimRecurringGeneration("2026-05")).not.toBeNull();
  });

  it("generates again after the templates change", () => {
    finishRecurringGeneration("2026-05", claimRecurringGeneration("2026-05")!, true);

    resetRecurringGeneration();

    expect(claimRecurringGeneration("2026-05")).not.toBeNull();
  });

  it("ignores a generation that finishes after the templates changed", () => {
    const claim = claimRecurringGeneration("2026-05");

    resetRecurringGeneration();
    finishRecurringGeneration("2026-05", claim!, true);

    expect(claimRecurringGeneration("2026-05")).not.toBeNull();
  });
});
