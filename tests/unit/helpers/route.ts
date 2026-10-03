import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFinanceDatabase } from "@/lib/db";
import { apiGuard } from "@/lib/auth/server";
import { createTestDatabase } from "@/tests/helpers/database";
import { createAccount } from "@/lib/server/accounts";
import { configureInvestmentPortfolio } from "@/lib/server/investments";

vi.mock("@/lib/auth/server", () => ({
  apiGuard: vi.fn(),
  requireActionSession: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/db")>()),
  getFinanceDatabase: vi.fn(),
}));

export function routeDatabase() {
  const state = { checkingId: "", creditId: "" };
  let database: Awaited<ReturnType<typeof createTestDatabase>>;
  beforeEach(async () => {
    vi.stubEnv("DEMO_MODE", "false");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-16T12:00:00Z"));
    vi.mocked(apiGuard).mockResolvedValue(null);
    database = await createTestDatabase();
    vi.mocked(getFinanceDatabase).mockResolvedValue(database.db);
    state.checkingId = (
      await createAccount(
        { name: "Principal", type: "checking", initialBalanceCents: 1000000 },
        database.db,
      )
    ).id;
    state.creditId = (
      await createAccount(
        {
          name: "Cartão",
          type: "credit",
          initialBalanceCents: 0,
          creditClosingDay: 5,
          creditDueDay: 12,
        },
        database.db,
      )
    ).id;
    await configureInvestmentPortfolio(
      {
        checkpointBalanceCents: 1000000,
        checkpointDate: "2026-07-16",
        expectedMonthlyRateBps: 100,
      },
      database.db,
    );
  });
  afterEach(async () => {
    database?.db.$client.close();
    if (database) await database.cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });
  return state;
}

export function request(method = "GET", body?: unknown, query = "") {
  return new Request(`http://localhost/api/test${query}`, {
    method,
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }),
  });
}

export function guardCases(
  route: Record<string, (...args: never[]) => Promise<Response>>,
) {
  describe("authorization and method contract", () => {
    for (const [method, handler] of Object.entries(route).filter(([name]) =>
      /^[A-Z]+$/.test(name),
    )) {
      it(`${method} rejects an unauthorized request before data access`, async () => {
        const denied = new Response("denied", { status: 401 });
        vi.mocked(apiGuard).mockResolvedValueOnce(denied);
        const response = await (
          handler as (request: Request, context: unknown) => Promise<Response>
        )(request(method), {
          params: Promise.resolve({ id: "missing", invoiceMonth: "2026-07" }),
        });
        expect(response).toBe(denied);
        expect(getFinanceDatabase).not.toHaveBeenCalled();
      });
    }
    for (const method of ["HEAD", "OPTIONS"]) {
      if (!(method in route)) continue;
      it(`${method} is unsupported and private`, async () => {
        const response = await (
          route[method] as (request: Request) => Promise<Response>
        )(request(method));
        expect(response.status).toBe(405);
        expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      });
    }
  });
}
