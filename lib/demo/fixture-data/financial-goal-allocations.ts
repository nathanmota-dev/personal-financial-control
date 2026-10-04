import type { DemoFixture } from "@/lib/demo/contracts";
import { id } from "./support";

export const financialGoalAllocations: DemoFixture["financialGoalAllocations"] = [
    {
      id: id("80000000-0000-4000-8000", 1),
      goalId: id("70000000-0000-4000-8000", 1),
      type: "initial_allocation",
      amountCents: 370000,
      occurredOn: "2026-02-01",
      notes: "Alocação inicial para a viagem.",
    },
    {
      id: id("80000000-0000-4000-8000", 2),
      goalId: id("70000000-0000-4000-8000", 1),
      type: "contribution",
      amountCents: 80000,
      occurredOn: "2026-06-20",
      notes: "Aporte de junho.",
    },
    {
      id: id("80000000-0000-4000-8000", 3),
      goalId: id("70000000-0000-4000-8000", 2),
      type: "initial_allocation",
      amountCents: 900000,
      occurredOn: "2026-01-10",
      notes: "Base da reserva de emergência.",
    },
    {
      id: id("80000000-0000-4000-8000", 4),
      goalId: id("70000000-0000-4000-8000", 3),
      type: "initial_allocation",
      amountCents: 450000,
      occurredOn: "2026-04-05",
      notes: "Meta concluída.",
    },
    {
      id: id("80000000-0000-4000-8000", 5),
      goalId: id("70000000-0000-4000-8000", 4),
      type: "initial_allocation",
      amountCents: 300000,
      occurredOn: "2025-12-15",
      notes: "Alocação histórica.",
    },
  ];
