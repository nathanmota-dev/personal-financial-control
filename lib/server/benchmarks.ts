import { z } from "zod";

import { demoBenchmarkRates } from "@/lib/demo/fixture-data/benchmarks";
import { isDemoMode } from "@/lib/demo/mode";
import { getServerEnv } from "@/lib/env";
import type { InvestmentBenchmarkRates } from "@/lib/interfaces/investment-history";
import { BrapiMarketDataProvider } from "@/lib/server/brapi";
import { DomainError } from "@/lib/server/errors";
import { listHistoryMonths } from "@/lib/investment-history";

/** Monthly CDI and IPCA, in % per month, from the Central Bank's SGS. */
const SGS_SERIES = { cdi: 4391, ipca: 433 } as const;
const IBOVESPA_SYMBOL = "^BVSP";
/** Index values are published at most once a day. */
const REVALIDATE_SECONDS = 86_400;
const TIMEOUT_MS = 5_000;
const BRAPI_RANGES = [[3, "3mo"], [6, "6mo"], [12, "1y"], [24, "2y"], [60, "5y"], [120, "10y"]] as const;

const sgsSchema = z.array(z.object({ data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/), valor: z.string() }));

type BenchmarkOptions = { fetcher?: typeof fetch; token?: string | null };

function toBcbDate(month: string, day: string) {
  const [year, monthNumber] = month.split("-");
  return `${day}/${monthNumber}/${year}`;
}

function lastDay(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return String(new Date(Date.UTC(year, monthNumber, 0)).getUTCDate());
}

export async function fetchSgsMonthlyRates(series: number, startMonth: string, endMonth: string, fetcher: typeof fetch = fetch) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series}/dados?formato=json&dataInicial=${toBcbDate(startMonth, "01")}&dataFinal=${toBcbDate(endMonth, lastDay(endMonth))}`;
  const response = await fetcher(url, { headers: { accept: "application/json" }, next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new DomainError("BENCHMARK_HTTP_ERROR", `O Banco Central respondeu com HTTP ${response.status}.`, response.status);
  const parsed = sgsSchema.safeParse(await response.json());
  if (!parsed.success) throw new DomainError("INVALID_BENCHMARK_DATA", "O Banco Central retornou uma série inválida.");
  const rates: Record<string, number> = {};
  for (const row of parsed.data) {
    const [, monthNumber, year] = row.data.split("/");
    const value = Number(row.valor.replace(",", "."));
    if (Number.isFinite(value)) rates[`${year}-${monthNumber}`] = value / 100;
  }
  return rates;
}

/** Monthly return of each month from the last close of the month before it. */
export function closesToMonthlyRates(closes: Record<string, number>) {
  const months = Object.keys(closes).sort();
  const rates: Record<string, number> = {};
  months.forEach((month, index) => {
    const previous = index ? closes[months[index - 1]] : undefined;
    if (previous) rates[month] = closes[month] / previous - 1;
  });
  return rates;
}

export function brapiRangeFor(monthCount: number) {
  return BRAPI_RANGES.find(([limit]) => monthCount <= limit)?.[1] ?? "max";
}

async function fetchIbovespaRates(startMonth: string, endMonth: string, token: string | null | undefined, fetcher: typeof fetch) {
  if (!token) return null;
  // The month before the start gives the first month its return.
  const range = brapiRangeFor(listHistoryMonths(startMonth, endMonth).length + 1);
  const closes = await new BrapiMarketDataProvider(token, fetcher).getMonthlyCloses(IBOVESPA_SYMBOL, range);
  return closesToMonthlyRates(closes);
}

function settled<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

/** Each index fails on its own: an unreachable source leaves only that line out of the chart. */
export async function getBenchmarkRates(startMonth: string, endMonth: string, options: BenchmarkOptions = {}): Promise<InvestmentBenchmarkRates> {
  if (isDemoMode()) return demoBenchmarkRates;
  const fetcher = options.fetcher ?? fetch;
  const token = options.token === undefined ? getServerEnv().BRAPI_API_TOKEN : options.token;
  const [cdi, ipca, ibov] = await Promise.allSettled([
    fetchSgsMonthlyRates(SGS_SERIES.cdi, startMonth, endMonth, fetcher),
    fetchSgsMonthlyRates(SGS_SERIES.ipca, startMonth, endMonth, fetcher),
    fetchIbovespaRates(startMonth, endMonth, token, fetcher),
  ]);
  return { cdi: settled(cdi), ipca: settled(ipca), ibov: settled(ibov) };
}
