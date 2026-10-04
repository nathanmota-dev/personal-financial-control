import type { DemoFixture } from "@/lib/demo/contracts";
import { accountIds } from "./support";

export const accounts: DemoFixture["accounts"] = [
    {
      id: accountIds.checking,
      name: "Nubank • Conta principal",
      type: "checking",
      initialBalanceCents: 420000,
    },
    {
      id: accountIds.savings,
      name: "Reserva de liquidez",
      type: "savings",
      initialBalanceCents: 850000,
    },
    {
      id: accountIds.cash,
      name: "Carteira",
      type: "cash",
      initialBalanceCents: 35000,
    },
    {
      id: accountIds.credit,
      name: "Visa Platinum",
      type: "credit",
      initialBalanceCents: 0,
      creditClosingDay: 10,
      creditDueDay: 18,
    },
    {
      id: accountIds.investment,
      name: "XP Investimentos",
      type: "investment",
      initialBalanceCents: 0,
    },
  ];
