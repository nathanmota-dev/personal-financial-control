import type { DemoFixture } from "@/lib/demo/contracts";
import { id } from "./support";

export const investmentHoldings: DemoFixture["investmentHoldings"] = [
    {
      id: id("91000000-0000-4000-8000", 1),
      name: "CDB liquidez diária",
      ticker: null,
      institutionName: "Nubank",
      assetClass: "fixed_income",
      instrumentType: "cdb",
      currentValueCents: 1100000,
      valueAsOf: "2026-07-16",
      notes: "Camada de liquidez imediata da carteira.",
    },
    {
      id: id("91000000-0000-4000-8000", 2),
      name: "Tesouro Selic 2029",
      ticker: "LFTS11",
      institutionName: "XP Investimentos",
      assetClass: "fixed_income",
      instrumentType: "treasury",
      currentValueCents: 650000,
      valueAsOf: "2026-07-15",
      notes: "Reserva de curto prazo com baixa volatilidade.",
    },
    {
      id: id("91000000-0000-4000-8000", 3),
      name: "ETF Brasil amplo",
      ticker: "BOVA11",
      institutionName: "XP Investimentos",
      assetClass: "equities",
      instrumentType: "etf",
      currentValueCents: 420000,
      valueAsOf: "2026-07-16",
      notes: "Exposição diversificada para objetivos de longo prazo.",
    },
  ];
