import type { DemoFixture } from "@/lib/demo/contracts";
import { accountIds,id } from "./support";

export const transfers: DemoFixture["transfers"] = [
    {
      id: id("d0000000-0000-4000-8000", 1),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.savings,
      amountCents: 100000,
      transferDate: "2026-07-08",
      competenceMonth: "2026-07",
      description: "Reforço da reserva",
    },
    {
      id: id("d0000000-0000-4000-8000", 2),
      fromAccountId: accountIds.checking,
      toAccountId: accountIds.cash,
      amountCents: 20000,
      transferDate: "2026-07-12",
      competenceMonth: "2026-07",
      description: "Dinheiro para a carteira",
    },
  ];
