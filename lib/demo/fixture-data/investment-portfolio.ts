import type { DemoFixture } from "@/lib/demo/contracts";
import { id } from "./support";

export const investmentPortfolio: DemoFixture["investmentPortfolio"] = [
    {
      id: id("90000000-0000-4000-8000", 1),
      checkpointBalanceCents: 1850000,
      expectedMonthlyRateBps: 85,
      checkpointDate: "2026-03-31",
    },
  ];
