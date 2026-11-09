import "server-only";
import type { z } from "zod";

import type { PluggyApi, PluggyCredentials, PluggyTransactionFilter } from "@/lib/interfaces/pluggy";
import { pluggyHttpError, pluggyInvalidResponse, pluggyNetworkError } from "./errors";
import {
  pluggyAccountSchema,
  pluggyAuthSchema,
  pluggyBillSchema,
  pluggyCursorSchema,
  pluggyInvestmentSchema,
  pluggyItemSchema,
  pluggyPageSchema,
  pluggyTransactionSchema,
} from "./schemas";

const API_KEY_LIFETIME_MS = 2 * 60 * 60 * 1000;
const API_KEY_RENEWAL_MARGIN_MS = 5 * 60 * 1000;
const MAX_PAGE_SIZE = 500;
/** `GET /v2/transactions` rejects `pageSize` and `from`: the page size is fixed and the dates are `dateFrom` and `dateTo`. */
const TRANSACTION_DATE_PARAMS = { from: "dateFrom", to: "dateTo" } as const;
const REQUEST_TIMEOUT_MS = 30_000;

/** `next` may be a URL or an opaque cursor; only its query is reused, so the key stays on the configured host. */
function cursorQuery(next: string) {
  if (/^(https?:\/\/|\/|\?)/i.test(next)) return new URL(next, "https://api.invalid").searchParams;
  return new URLSearchParams({ cursor: next });
}

function transactionQuery({ from, to }: PluggyTransactionFilter) {
  const dates = { [TRANSACTION_DATE_PARAMS.from]: from, [TRANSACTION_DATE_PARAMS.to]: to };
  return new URLSearchParams(Object.entries(dates).flatMap(([name, value]) => value ? [[name, value]] : []));
}

export class PluggyClient implements PluggyApi {
  private apiKey?: { value: string; renewAt: number };
  private authentication?: Promise<string>;

  constructor(
    private readonly credentials: PluggyCredentials,
    private readonly fetcher: typeof fetch = fetch,
    private readonly baseUrl = "https://api.pluggy.ai",
    private readonly now: () => number = Date.now,
  ) {}

  getItem(itemId: string) {
    return this.get(`/items/${encodeURIComponent(itemId)}`, pluggyItemSchema);
  }

  listAccounts(itemId: string) {
    return this.listPages("/accounts", { itemId }, pluggyAccountSchema);
  }

  async listTransactions(accountId: string, filter: PluggyTransactionFilter = {}) {
    const schema = pluggyCursorSchema(pluggyTransactionSchema);
    const results: z.infer<typeof pluggyTransactionSchema>[] = [];
    const seen = new Set<string>();
    let query = transactionQuery(filter);
    for (;;) {
      query.set("accountId", accountId);
      query.delete("pageSize");
      const page = await this.get(`/v2/transactions?${query}`, schema);
      results.push(...page.results);
      if (!page.next) return results;
      if (seen.has(page.next)) throw pluggyInvalidResponse();
      seen.add(page.next);
      query = cursorQuery(page.next);
    }
  }

  listBills(accountId: string) {
    return this.listPages("/bills", { accountId }, pluggyBillSchema);
  }

  listInvestments(itemId: string) {
    return this.listPages("/investments", { itemId }, pluggyInvestmentSchema);
  }

  private async listPages<T extends z.ZodType>(path: string, filter: Record<string, string>, item: T) {
    const schema = pluggyPageSchema(item);
    const results: z.infer<T>[] = [];
    for (let page = 1; ; page++) {
      const query = new URLSearchParams({ ...filter, page: String(page), pageSize: String(MAX_PAGE_SIZE) });
      const body = await this.get(`${path}?${query}`, schema);
      results.push(...(body.results as z.infer<T>[]));
      const finished = body.totalPages == null ? body.results.length < MAX_PAGE_SIZE : page >= body.totalPages;
      if (finished) return results;
    }
  }

  private async get<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
    const response = await this.send(path, { headers: { "X-API-KEY": await this.currentKey(), accept: "application/json" } });
    if (response.status === 401) this.apiKey = undefined;
    return this.parse(response, schema);
  }

  private currentKey() {
    if (this.apiKey && this.now() < this.apiKey.renewAt) return Promise.resolve(this.apiKey.value);
    this.authentication ??= this.authenticate().finally(() => { this.authentication = undefined; });
    return this.authentication;
  }

  private async authenticate() {
    const response = await this.send("/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify(this.credentials),
    });
    const { apiKey } = await this.parse(response, pluggyAuthSchema);
    this.apiKey = { value: apiKey, renewAt: this.now() + API_KEY_LIFETIME_MS - API_KEY_RENEWAL_MARGIN_MS };
    return apiKey;
  }

  private async send(path: string, init: RequestInit) {
    try {
      return await this.fetcher(`${this.baseUrl}${path}`, { ...init, cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch {
      throw pluggyNetworkError();
    }
  }

  private async parse<T extends z.ZodType>(response: Response, schema: T): Promise<z.infer<T>> {
    if (!response.ok) throw pluggyHttpError(response.status);
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw pluggyInvalidResponse();
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw pluggyInvalidResponse();
    return parsed.data;
  }
}
