import { describe, expect, it, vi } from "vitest";

import { DomainError } from "@/lib/server/errors";
import { PluggyClient } from "@/lib/server/pluggy/client";

const credentials = { clientId: "client-id", clientSecret: "super-secret" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function setup(routes: (url: URL, init?: RequestInit) => Response | Promise<Response>, start = 0) {
  let current = start;
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    return url.pathname === "/auth" ? json({ apiKey: `key-${fetcher.mock.calls.length}` }) : routes(url, init);
  });
  const client = new PluggyClient(credentials, fetcher as unknown as typeof fetch, "https://pluggy.test", () => current);
  const data = () => fetcher.mock.calls.map(([input, init]) => ({ url: new URL(String(input)), init })).filter(({ url }) => url.pathname !== "/auth");
  const auths = () => fetcher.mock.calls.filter(([input]) => new URL(String(input)).pathname === "/auth").length;
  return { client, fetcher, data, auths, advance: (ms: number) => { current += ms; } };
}

const item = { id: "item-1", status: "UPDATED" };

describe("Pluggy authentication", () => {
  it("exchanges credentials once and sends the key as X-API-KEY", async () => {
    const { client, fetcher, data, auths } = setup(() => json(item));
    await client.getItem("item-1");
    await client.getItem("item-1");
    expect(auths()).toBe(1);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual(credentials);
    expect(new Headers(data()[1].init?.headers).get("X-API-KEY")).toBe("key-1");
  });

  it("shares one exchange between concurrent requests", async () => {
    const { client, auths } = setup(() => json(item));
    await Promise.all([client.getItem("a"), client.getItem("b"), client.getItem("c")]);
    expect(auths()).toBe(1);
  });

  it("renews the key before its two-hour lifetime ends", async () => {
    const { client, auths, advance } = setup(() => json(item));
    await client.getItem("item-1");
    advance(114 * 60 * 1000);
    await client.getItem("item-1");
    expect(auths()).toBe(1);
    advance(2 * 60 * 1000);
    await client.getItem("item-1");
    expect(auths()).toBe(2);
  });

  it("discards a key the API rejected", async () => {
    let status = 401;
    const { client, auths } = setup(() => json(item, status));
    await expect(client.getItem("item-1")).rejects.toMatchObject({ code: "PLUGGY_UNAUTHORIZED" });
    status = 200;
    await client.getItem("item-1");
    expect(auths()).toBe(2);
  });
});

describe("Pluggy pagination", () => {
  const transaction = (id: string) => ({ id, date: "2026-07-01T12:00:00.000Z", amount: -10 });

  it("follows an opaque cursor through every page without the parameters the API rejects", async () => {
    const { client, data } = setup((url) => json(url.searchParams.get("cursor") ? { results: [transaction("b")], next: null } : { results: [transaction("a")], next: "abc" }));
    await expect(client.listTransactions("account-1", { from: "2026-01-01" })).resolves.toMatchObject([{ id: "a" }, { id: "b" }]);
    const [first, second] = data();
    expect(first.url.pathname).toBe("/v2/transactions");
    expect(first.url.searchParams.get("dateFrom")).toBe("2026-01-01");
    expect(first.url.searchParams.has("from")).toBe(false);
    expect(second.url.searchParams.get("cursor")).toBe("abc");
    for (const { url } of data()) {
      expect(url.searchParams.get("accountId")).toBe("account-1");
      expect(url.searchParams.has("pageSize")).toBe(false);
    }
  });

  it("reuses only the query of a URL cursor and keeps the configured host", async () => {
    const { client, data } = setup((url) => json(url.searchParams.get("after") ? { results: [transaction("b")] } : { results: [transaction("a")], next: "https://attacker.test/v2/transactions?after=x&pageSize=9000" }));
    await client.listTransactions("account-1");
    expect(data()[1].url.host).toBe("pluggy.test");
    expect(data()[1].url.searchParams.has("pageSize")).toBe(false);
  });

  it("sends the end of the period as dateTo", async () => {
    const { client, data } = setup(() => json({ results: [] }));
    await client.listTransactions("account-1", { to: "2026-02-01" });
    expect(data()[0].url.searchParams.get("dateTo")).toBe("2026-02-01");
    expect(data()[0].url.searchParams.has("to")).toBe(false);
  });

  it("rejects a cursor that repeats instead of looping forever", async () => {
    const { client } = setup(() => json({ results: [transaction("a")], next: "same" }));
    await expect(client.listTransactions("account-1")).rejects.toMatchObject({ code: "PLUGGY_INVALID_RESPONSE" });
  });

  it("exhausts numbered pages by totalPages", async () => {
    const account = (id: string) => ({ id, type: "BANK", name: id });
    const { client, data } = setup((url) => json({ results: [account(`a${url.searchParams.get("page")}`)], totalPages: 3 }));
    await expect(client.listAccounts("item-1")).resolves.toHaveLength(3);
    expect(data().map(({ url }) => url.searchParams.get("page"))).toEqual(["1", "2", "3"]);
    expect(data().every(({ url }) => url.searchParams.get("pageSize") === "500")).toBe(true);
  });

  it("stops at a short page when the total is unknown", async () => {
    const { client, data } = setup(() => json({ results: [{ id: "b", dueDate: "2026-07-10" }] }));
    await expect(client.listBills("account-1")).resolves.toHaveLength(1);
    expect(data()).toHaveLength(1);
  });

  it("continues past a full page when the total is unknown", async () => {
    const full = Array.from({ length: 500 }, (_, index) => ({ id: `i${index}` }));
    const { client, data } = setup((url) => json({ results: url.searchParams.get("page") === "1" ? full : [] }));
    await expect(client.listInvestments("item-1")).resolves.toHaveLength(500);
    expect(data()).toHaveLength(2);
  });
});

describe("Pluggy failures", () => {
  it.each([
    [401, "PLUGGY_UNAUTHORIZED", 502],
    [403, "PLUGGY_FORBIDDEN", 502],
    [404, "PLUGGY_NOT_FOUND", 404],
    [429, "PLUGGY_RATE_LIMITED", 429],
    [500, "PLUGGY_UNAVAILABLE", 503],
    [503, "PLUGGY_UNAVAILABLE", 503],
    [400, "PLUGGY_REQUEST_FAILED", 502],
  ])("maps HTTP %i to %s without leaking secrets", async (status, code, mapped) => {
    const { client } = setup(() => json({ message: "super-secret key-1 payload" }, status));
    const error = await client.getItem("item-1").catch((failure: unknown) => failure) as DomainError;
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({ code, status: mapped });
    expect(JSON.stringify({ message: error.message, stack: error.stack })).not.toMatch(/super-secret|key-1|payload/);
  });

  it.each([
    ["a schema mismatch", () => json({ id: 1 })],
    ["invalid JSON", () => new Response("<html>")],
  ])("maps %s to a safe domain error", async (_name, respond) => {
    const { client } = setup(respond);
    await expect(client.getItem("item-1")).rejects.toMatchObject({ code: "PLUGGY_INVALID_RESPONSE", status: 502 });
  });

  it("maps authentication and network failures without the credentials", async () => {
    const rejected = new PluggyClient(credentials, vi.fn(async () => json({}, 401)) as unknown as typeof fetch);
    await expect(rejected.getItem("item-1")).rejects.toMatchObject({ code: "PLUGGY_UNAUTHORIZED" });
    const offline = new PluggyClient(credentials, vi.fn(async () => { throw new Error("super-secret"); }) as unknown as typeof fetch);
    const error = await offline.getItem("item-1").catch((failure: unknown) => failure) as DomainError;
    expect(error.code).toBe("PLUGGY_UNAVAILABLE");
    expect(error.message).not.toContain("super-secret");
  });
});
