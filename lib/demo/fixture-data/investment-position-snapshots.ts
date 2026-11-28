import type { DemoFixture } from "@/lib/demo/contracts";
import { id } from "./support";

const holding = (value: number) => id("91000000-0000-4000-8000", value);

/** Month-end values of each demo position. The ETF starts in January, so its first value reads as a contribution. */
const series: [holdingNumber: number, firstMonth: string, values: number[]][] = [
  [1, "2025-08", [980000, 990300, 1001200, 1013400, 1024000, 1036300, 1048300, 1058700, 1071500, 1083300, 1095600, 1100000]],
  [2, "2025-08", [590000, 595200, 600700, 606800, 611900, 617800, 623600, 628600, 634700, 640000, 645900, 650000]],
  [3, "2026-01", [380000, 388000, 371000, 395000, 402000, 398000, 420000]],
];

function monthAt(firstMonth: string, offset: number) {
  const [year, month] = firstMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const investmentPositionSnapshots: DemoFixture["investmentPositionSnapshots"] = series.flatMap(([holdingNumber, firstMonth, values]) =>
  values.map((currentValueCents, offset) => {
    const month = monthAt(firstMonth, offset);
    return {
      id: id("95000000-0000-4000-8000", holdingNumber * 100 + offset + 1),
      holdingId: holding(holdingNumber),
      snapshotDate: month === "2026-07" ? "2026-07-16" : `${month}-28`,
      quantityUnits: 0,
      costCents: null,
      currentValueCents,
      unitPriceCents: null,
      valuationSource: "manual_balance" as const,
    };
  }),
);
