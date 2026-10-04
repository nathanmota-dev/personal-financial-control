import type { DemoFixture } from "@/lib/demo/contracts";
import { id } from "./support";

export const investmentPurposeAllocations: DemoFixture["investmentPurposeAllocations"] = [
    {
      id: id("93000000-0000-4000-8000", 1),
      holdingId: id("91000000-0000-4000-8000", 1),
      purposeId: id("92000000-0000-4000-8000", 1),
      amountCents: 1100000,
      allocatedOn: "2026-07-10",
      notes: "Parte líquida da reserva.",
    },
    {
      id: id("93000000-0000-4000-8000", 2),
      holdingId: id("91000000-0000-4000-8000", 2),
      purposeId: id("92000000-0000-4000-8000", 2),
      amountCents: 450000,
      allocatedOn: "2026-07-11",
      notes: "Parcela inicial do objetivo do carro.",
    },
    {
      id: id("93000000-0000-4000-8000", 4),
      holdingId: id("91000000-0000-4000-8000", 3),
      purposeId: id("92000000-0000-4000-8000", 2),
      amountCents: 220000,
      allocatedOn: "2026-07-12",
      notes: "Mesmo ETF dividido entre duas finalidades.",
    },
  ];
