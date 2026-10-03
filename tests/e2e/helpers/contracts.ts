export interface MarketResponse {
  status?: number;
  price?: number;
  invalid?: boolean;
}
export interface FinanceServer {
  url: string;
  directory: string;
  logs: () => string;
  market: (response: MarketResponse) => Promise<void>;
  close: () => Promise<void>;
}
