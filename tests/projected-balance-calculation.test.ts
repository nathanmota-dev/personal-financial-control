import { describe, expect, it } from "vitest";

import {
  calculateDailyProjection,
  createProjectionSimulationEvent,
  recalculateProjectionWithSimulations,
} from "@/lib/projected-balance";
import type { ProjectionSimulation } from "@/lib/interfaces/projected-balance";

describe("projected balance calculation", () => {
  it("keeps daily availability signed when future commitments exceed the balance", () => {
    const projection = calculateDailyProjection({
      startDate: "2026-07-01",
      endDate: "2026-07-05",
      initialBalanceCents: 100000,
      minimumReserveCents: 50000,
      events: [
        {
          id: "expense",
          source: "transaction",
          type: "expense",
          description: "Despesa futura",
          amountCents: 60000,
          netImpactCents: -60000,
          date: "2026-07-03",
        },
      ],
    });

    expect(projection.summary.availablePerDayCents).toBe(-2000);
    expect(projection.daily.find((day) => day.date === "2026-07-03")).toMatchObject({
      projectedBalanceCents: 40000,
      availablePerDayCents: -3334,
      status: "warning",
    });
  });

  it("recalculates all later days when a temporary purchase is added", () => {
    const baseProjection = calculateDailyProjection({
      startDate: "2026-07-01",
      endDate: "2026-07-05",
      initialBalanceCents: 100000,
      minimumReserveCents: 0,
      events: [
        {
          id: "salary",
          source: "transaction",
          type: "income",
          description: "Salário",
          amountCents: 100000,
          netImpactCents: 100000,
          date: "2026-07-04",
        },
      ],
    });
    const simulation: ProjectionSimulation = {
      id: "purchase-1",
      accountId: "account-1",
      accountName: "Conta principal",
      date: "2026-07-02",
      description: "Notebook",
      amountCents: 150000,
    };

    const projection = recalculateProjectionWithSimulations(baseProjection, [simulation]);

    expect(projection.daily.find((day) => day.date === "2026-07-02")).toMatchObject({
      projectedBalanceCents: -50000,
      status: "negative",
    });
    expect(projection.daily.find((day) => day.date === "2026-07-03")?.status).toBe("negative");
    expect(projection.daily.find((day) => day.date === "2026-07-04")).toMatchObject({
      projectedBalanceCents: 50000,
      status: "safe",
    });
    expect(projection.summary.firstNegativeDate).toBe("2026-07-02");
    expect(projection.summary.finalProjectedBalanceCents).toBe(50000);
  });

  it("maps simulations to removable expense events", () => {
    const event = createProjectionSimulationEvent({
      id: "purchase-1",
      accountId: "account-1",
      accountName: "Conta principal",
      date: "2026-07-02",
      description: "Notebook",
      amountCents: 150000,
    });

    expect(event).toMatchObject({
      id: "simulation:purchase-1",
      source: "simulation",
      type: "expense",
      netImpactCents: -150000,
      metadata: {
        simulationId: "purchase-1",
        accountName: "Conta principal",
      },
    });
  });
});
