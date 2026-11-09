import { expect, it, vi } from "vitest";

import { apiGuard } from "@/lib/auth/server";
import { getFinanceDatabase } from "@/lib/db";
import type { PluggyApi } from "@/lib/interfaces/pluggy";
import { request } from "../../../helpers/route";

export function pluggyApi(overrides: Partial<PluggyApi> = {}): PluggyApi {
  return {
    getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED", connector: { name: "MeuPluggy" }, lastUpdatedAt: "2026-07-16T10:00:00.000Z", nextAutoSyncAt: "not-a-date" })),
    listAccounts: vi.fn(async () => [
      { id: "remote-bank", type: "BANK", name: "Corrente", marketingName: " Conta Plus ", number: "0012345" },
      { id: "remote-card", type: "CREDIT", name: "Cartão" },
    ]),
    listTransactions: vi.fn(async () => []),
    listBills: vi.fn(async () => []),
    listInvestments: vi.fn(async () => []),
    ...overrides,
  };
}

type RouteModule = Record<string, unknown>;
type Handler = (request: Request) => Promise<Response>;

export function pluggyGuardCases(route: RouteModule) {
  const methods = Object.keys(route).filter((name) => /^[A-Z]+$/.test(name) && !["HEAD", "OPTIONS"].includes(name));
  const handler = (method: string) => route[method] as Handler;

  it.each(methods.flatMap((method) => [401, 423, 415].map((status) => [method, status] as const)))("%s returns guard status %i before data access", async (method, status) => {
    vi.mocked(apiGuard).mockResolvedValueOnce(new Response(null, { status }));
    const response = await handler(method)(request(method));
    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(getFinanceDatabase).not.toHaveBeenCalled();
  });

  it.each([...methods, "HEAD", "OPTIONS"])("%s returns a private 404 in demo mode", async (method) => {
    vi.stubEnv("DEMO_MODE", "true");
    const response = await handler(method)(request(method));
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(getFinanceDatabase).not.toHaveBeenCalled();
  });

  it.each(methods)("%s replies privately on success or failure", async (method) => {
    const response = await handler(method)(request(method, ["GET", "DELETE"].includes(method) ? undefined : {}));
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
}
