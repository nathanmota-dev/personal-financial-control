import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { configureInvestmentPortfolio } from "@/lib/server/investments";
import { createTestDatabase } from "@/tests/helpers/database";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const cleanups: Array<() => Promise<void>> = [];
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalToken = process.env.TOKEN;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-16T12:00:00.000Z"));
});

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));

  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }

  if (originalToken === undefined) {
    delete process.env.TOKEN;
  } else {
    process.env.TOKEN = originalToken;
  }

  vi.resetModules();
  vi.useRealTimers();
});

async function loadGoalsRoute(databaseUrl: string) {
  process.env.DATABASE_URL = databaseUrl;
  delete process.env.TOKEN;
  vi.resetModules();

  return import("@/app/api/goals/route");
}

describe("goals api", () => {
  it("creates a goal through POST /api/goals", async () => {
    const { db, databaseUrl, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 100000,
        expectedMonthlyRateBps: 100,
        checkpointDate: "2026-07-16",
      },
      db
    );

    const { POST } = await loadGoalsRoute(databaseUrl);
    const response = await POST(
      new Request("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({
          name: "MacBook",
          category: "electronics",
          targetAmountCents: 150000,
          initialAllocationCents: 25000,
          initialAllocationDate: "2026-07-09",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload).toMatchObject({
      ok: true,
      data: {
        goal: {
          name: "MacBook",
          allocatedCents: 25000,
        },
      },
    });
  });

  it("returns a Zod error for invalid goal payloads", async () => {
    const { databaseUrl, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);
    const { POST } = await loadGoalsRoute(databaseUrl);

    const response = await POST(
      new Request("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({
          name: "",
          category: "electronics",
          targetAmountCents: -1,
          priority: 99,
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("INVALID_GOAL_PAYLOAD");
    expect(payload.error.issues.length).toBeGreaterThan(0);
  });

  it("returns a domain error when initial allocation exceeds free reserve", async () => {
    const { db, databaseUrl, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 1000,
        expectedMonthlyRateBps: 100,
        checkpointDate: "2026-07-16",
      },
      db
    );

    const { POST } = await loadGoalsRoute(databaseUrl);
    const response = await POST(
      new Request("http://localhost/api/goals", {
        method: "POST",
        body: JSON.stringify({
          name: "Carro",
          category: "vehicle",
          targetAmountCents: 5000000,
          initialAllocationCents: 1001,
          initialAllocationDate: "2026-07-09",
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toMatchObject({
      ok: false,
      error: {
        code: "GOAL_ALLOCATION_EXCEEDS_FREE_RESERVE",
      },
    });
  });
});
