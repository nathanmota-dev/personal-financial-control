import { z } from "zod";

import type { MarketDataProvider, MarketQuote } from "@/lib/interfaces/market-data";
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
}
