import { afterEach, describe, expect, it, vi } from "vitest";

import { demoBenchmarkRates } from "@/lib/demo/fixture-data/benchmarks";
import { brapiRangeFor, closesToMonthlyRates, fetchSgsMonthlyRates, getBenchmarkRates } from "@/lib/server/benchmarks";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function routedFetcher(routes: { sgs4391?: Response; sgs433?: Response; brapi?: Response }) {
  return vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    const response = url.includes("sgs.4391") ? routes.sgs4391 : url.includes("sgs.433") ? routes.sgs433 : routes.brapi;
    if (!response) throw new Error("offline");
    return response;
  });
}

afterEach(() => vi.unstubAllEnvs());

describe("benchmark rates", () => {
  it("reads a monthly SGS series as fractions by month", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json([{ data: "01/01/2026", valor: "1.16" }, { data: "01/02/2026", valor: "0,99" }, { data: "01/03/2026", valor: "n/d" }]));
    const rates = await fetchSgsMonthlyRates(4391, "2026-01", "2026-02", fetcher);
    expect(rates["2026-01"]).toBeCloseTo(0.0116, 10);
    expect(rates["2026-02"]).toBeCloseTo(0.0099, 10);
    expect(rates).not.toHaveProperty("2026-03");
    expect(String(fetcher.mock.calls[0][0])).toBe("https://api.bcb.gov.br/dados/serie/bcdata.sgs.4391/dados?formato=json&dataInicial=01/01/2026&dataFinal=28/02/2026");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ next: { revalidate: 86_400 } });
  });

  it("rejects HTTP errors and malformed series", async () => {
    await expect(fetchSgsMonthlyRates(433, "2026-01", "2026-02", vi.fn<typeof fetch>().mockResolvedValue(json({}, 503)))).rejects.toMatchObject({ code: "BENCHMARK_HTTP_ERROR" });
    await expect(fetchSgsMonthlyRates(433, "2026-01", "2026-02", vi.fn<typeof fetch>().mockResolvedValue(json({ data: [] })))).rejects.toMatchObject({ code: "INVALID_BENCHMARK_DATA" });
  });

  it("turns monthly closes into monthly returns", () => {
    const rates = closesToMonthlyRates({ "2026-02": 110, "2026-01": 100, "2026-03": 99 });
    expect(Object.keys(rates)).toEqual(["2026-02", "2026-03"]);
    expect(rates["2026-02"]).toBeCloseTo(0.1, 10);
    expect(rates["2026-03"]).toBeCloseTo(-0.1, 10);
  });

  it.each([[2, "3mo"], [6, "6mo"], [13, "2y"], [60, "5y"], [100, "10y"], [500, "max"]] as const)("asks brapi for %i months with range %s", (months, range) => {
    expect(brapiRangeFor(months)).toBe(range);
  });

  it("reads each index on its own and leaves out the ones that fail", async () => {
    vi.stubEnv("DEMO_MODE", "false");
    const fetcher = routedFetcher({
      sgs4391: json([{ data: "01/02/2026", valor: "1.00" }]),
      brapi: json({ results: [{ historicalDataPrice: [{ date: Date.UTC(2026, 0, 2) / 1000, close: 100 }, { date: Date.UTC(2026, 1, 2) / 1000, close: 105 }] }] }),
    });
    const rates = await getBenchmarkRates("2026-01", "2026-02", { fetcher, token: "token" });
    expect(rates.cdi).toEqual({ "2026-02": 0.01 });
    expect(rates.ipca).toBeNull();
    expect(rates.ibov?.["2026-02"]).toBeCloseTo(0.05, 10);
    expect(fetcher.mock.calls.map(([url]) => String(url)).find((url) => url.includes("brapi"))).toContain("%5EBVSP?range=3mo&interval=1mo&token=token");
  });

  it("skips the Ibovespa without a brapi token and serves fixed rates in demo mode", async () => {
    vi.stubEnv("DEMO_MODE", "false");
    const fetcher = routedFetcher({ sgs4391: json([]), sgs433: json([]) });
    expect(await getBenchmarkRates("2026-01", "2026-02", { fetcher, token: null })).toEqual({ cdi: {}, ipca: {}, ibov: null });
    vi.stubEnv("DEMO_MODE", "true");
    expect(await getBenchmarkRates("2026-01", "2026-02", { fetcher })).toBe(demoBenchmarkRates);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
