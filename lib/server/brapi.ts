import { z } from "zod";

import type { MarketDataProvider,MarketQuote } from "@/lib/interfaces/market-data";
import { DomainError } from "@/lib/server/errors";

const responseSchema = z.object({
  results: z.array(z.object({
    symbol: z.string().min(1),
    currency: z.string().default("BRL"),
    regularMarketPrice: z.number().positive(),
    regularMarketTime: z.string().or(z.number()),
    marketState: z.string().optional(),
  })).min(1),
});

const historySchema = z.object({
  results: z.array(z.object({
    historicalDataPrice: z.array(z.object({ date: z.number(), close: z.number().positive().nullable().optional() })).default([]),
  })).min(1),
});

/** Monthly history is public market data that changes once a day, so it may be cached. */
const HISTORY_REVALIDATE_SECONDS = 86_400;
const HISTORY_TIMEOUT_MS = 5_000;

function normalizeMarketState(value?: string): MarketQuote["marketState"] {
  const state = value?.toUpperCase();
  if (state === "REGULAR") return "regular";
  if (state === "CLOSED" || state === "POST" || state === "PRE") return "closed";
  return "unknown";
}

export class BrapiMarketDataProvider implements MarketDataProvider {
  readonly name = "brapi" as const;

  constructor(
    private readonly token: string,
    private readonly fetcher: typeof fetch = fetch,
    private readonly baseUrl = "https://brapi.dev/api/quote"
  ) {}

  async getQuote(rawSymbol: string): Promise<MarketQuote> {
    const symbol = rawSymbol.trim().toUpperCase();
    const response = await this.fetcher(`${this.baseUrl}/${encodeURIComponent(symbol)}?token=${encodeURIComponent(this.token)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      const known = [401, 403, 429].includes(response.status);
      throw new DomainError("MARKET_DATA_HTTP_ERROR", known ? `A brapi respondeu com HTTP ${response.status}.` : "Não foi possível consultar a brapi.", response.status);
    }
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) throw new DomainError("INVALID_MARKET_DATA", "A brapi retornou uma cotação inválida.");
    const quote = parsed.data.results[0];
    const quotedAt = new Date(typeof quote.regularMarketTime === "number" ? quote.regularMarketTime * 1000 : quote.regularMarketTime);
    if (Number.isNaN(quotedAt.getTime())) throw new DomainError("INVALID_MARKET_DATA", "A brapi retornou um horário de cotação inválido.");
    return {
      symbol: quote.symbol.toUpperCase(),
      currency: quote.currency,
      unitPriceCents: Math.round(quote.regularMarketPrice * 100),
      quotedAt,
      marketState: normalizeMarketState(quote.marketState),
    };
  }

  /** Last close of each month in the range, by `YYYY-MM`. */
  async getMonthlyCloses(rawSymbol: string, range: string): Promise<Record<string, number>> {
    const symbol = rawSymbol.trim().toUpperCase();
    const response = await this.fetcher(`${this.baseUrl}/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}&interval=1mo&token=${encodeURIComponent(this.token)}`, {
      headers: { accept: "application/json" },
      next: { revalidate: HISTORY_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(HISTORY_TIMEOUT_MS),
    });
    if (!response.ok) throw new DomainError("MARKET_DATA_HTTP_ERROR", `A brapi respondeu com HTTP ${response.status}.`, response.status);
    const parsed = historySchema.safeParse(await response.json());
    if (!parsed.success) throw new DomainError("INVALID_MARKET_DATA", "A brapi retornou um histórico inválido.");
    const closes: Record<string, number> = {};
    for (const row of [...parsed.data.results[0].historicalDataPrice].sort((left, right) => left.date - right.date)) {
      if (row.close) closes[new Date(row.date * 1000).toISOString().slice(0, 7)] = row.close;
    }
    return closes;
  }
}
