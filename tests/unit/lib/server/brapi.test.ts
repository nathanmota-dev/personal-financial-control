import { describe, expect, it, vi } from "vitest";
import { BrapiMarketDataProvider } from "@/lib/server/brapi";

function provider(body: unknown, status = 200) {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  return {
    api: new BrapiMarketDataProvider("token & secret", fetcher),
    fetcher,
  };
}

describe("brapi quote normalization", () => {
  it.each(["REGULAR", "CLOSED", "POST", "PRE", "unknown", undefined])(
    "normalizes market state %s and cents",
    async (marketState) => {
      const { api, fetcher } = provider({
        results: [
          {
            symbol: "petr4",
            regularMarketPrice: 32.125,
            regularMarketTime: 1784203200,
            marketState,
          },
        ],
      });
      expect(await api.getQuote(" petr4 ")).toEqual({
        symbol: "PETR4",
        currency: "BRL",
        unitPriceCents: 3213,
        quotedAt: new Date(1784203200000),
        marketState:
          marketState === "REGULAR"
            ? "regular"
            : ["CLOSED", "POST", "PRE"].includes(marketState ?? "")
              ? "closed"
              : "unknown",
      });
      expect(fetcher).toHaveBeenCalledWith(
        "https://brapi.dev/api/quote/PETR4?token=token%20%26%20secret",
        { headers: { accept: "application/json" }, cache: "no-store" },
      );
      expect(api.name).toBe("brapi");
    },
  );
  it("supports ISO timestamps, currency and encoded symbols at a custom endpoint", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            results: [
              {
                symbol: "a/b",
                currency: "USD",
                regularMarketPrice: 1.01,
                regularMarketTime: "2026-07-16T12:00:00Z",
                marketState: "regular",
              },
            ],
          }),
        ),
      );
    const api = new BrapiMarketDataProvider(
      "",
      fetcher,
      "https://example.test/quotes",
    );
    expect(await api.getQuote("a/b")).toMatchObject({
      symbol: "A/B",
      currency: "USD",
      unitPriceCents: 101,
      marketState: "regular",
    });
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://example.test/quotes/A%2FB?token=",
    );
  });
  it.each([401, 403, 429, 500])(
    "preserves HTTP error status %s",
    async (status) => {
      await expect(
        provider({}, status).api.getQuote("PETR4"),
      ).rejects.toMatchObject({
        code: "MARKET_DATA_HTTP_ERROR",
        status,
        message:
          status === 500
            ? "Não foi possível consultar a brapi."
            : `A brapi respondeu com HTTP ${status}.`,
      });
    },
  );
  it.each([
    { results: [] },
    { results: [{ symbol: "", regularMarketPrice: 10, regularMarketTime: 1 }] },
    { results: [{ symbol: "A", regularMarketPrice: 0, regularMarketTime: 1 }] },
    {},
    {
      results: [
        { symbol: "A", regularMarketPrice: 10, regularMarketTime: "invalid" },
      ],
    },
  ])("rejects invalid quotes: %j", async (body) => {
    await expect(provider(body).api.getQuote("A")).rejects.toMatchObject({
      code: "INVALID_MARKET_DATA",
    });
  });
  it("propagates network and malformed JSON failures", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("offline"));
    await expect(
      new BrapiMarketDataProvider("", fetcher).getQuote("A"),
    ).rejects.toThrow("offline");
    fetcher.mockResolvedValue(new Response("bad json"));
    await expect(
      new BrapiMarketDataProvider("", fetcher).getQuote("A"),
    ).rejects.toThrow();
  });
});
