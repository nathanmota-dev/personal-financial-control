import { createClient } from "@libsql/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  archiveInvestmentHolding,
  archiveInvestmentPurpose,
  createInvestmentHolding,
  createInvestmentPurpose,
  deleteInvestmentPurposeAllocation,
  getInvestmentPortfolioDashboard,
  updateInvestmentHolding,
  upsertInvestmentPurposeAllocation,
} from "@/lib/server/investment-portfolio";
import { getInvestmentPortfolio } from "@/lib/server/investments";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-16T12:00:00.000Z"));
});

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
  vi.useRealTimers();
});

describe("investment portfolio classification", () => {
  it("creates holdings, purposes, and splits one holding across multiple purposes", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const holding = await createInvestmentHolding(
      {
        name: "ETF Brasil",
        ticker: "BOVA11",
        institutionName: "Corretora",
        assetClass: "equities",
        instrumentType: "etf",
        currentValueCents: 200000,
        valueAsOf: "2026-07-16",
        notes: null,
      },
      db
    );
    const secondHolding = await createInvestmentHolding(
      {
        name: "CDB",
        institutionName: "Banco",
        assetClass: "fixed_income",
        instrumentType: "cdb",
        currentValueCents: 100000,
        valueAsOf: "2026-07-15",
      },
      db
    );
    const emergency = await createInvestmentPurpose(
      {
        name: "Reserva de emergência",
        targetAmountCents: 300000,
        notes: null,
      },
      db
    );
    const car = await createInvestmentPurpose(
      {
        name: "Carro",
        color: "#f59e0b",
      },
      db
    );

    const firstAllocation = await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: emergency.id,
        amountCents: 100000,
        allocatedOn: "2026-07-10",
      },
      db
    );
    await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: car.id,
        amountCents: 50000,
        allocatedOn: "2026-07-12",
      },
      db
    );
    await upsertInvestmentPurposeAllocation(
      {
        holdingId: secondHolding.id,
        purposeId: emergency.id,
        amountCents: 100000,
        allocatedOn: "2026-07-11",
      },
      db
    );

    expect(firstAllocation.allocatedOn).toBe("2026-07-10");

    const dashboard = await getInvestmentPortfolioDashboard(db);

    expect(dashboard.totalRegisteredCents).toBe(300000);
    expect(dashboard.totalAllocatedCents).toBe(250000);
    expect(dashboard.unclassifiedCents).toBe(50000);
    expect(dashboard.holdings.find((item) => item.id === holding.id)).toMatchObject({
      allocatedCents: 150000,
      freeValueCents: 50000,
      allocationCount: 2,
    });
    expect(dashboard.purposes.find((item) => item.id === emergency.id)).toMatchObject({
      allocatedCents: 200000,
      holdingCount: 2,
    });
    expect(dashboard.distribution).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetClass: "equities",
          amountCents: 200000,
        }),
        expect.objectContaining({
          assetClass: "fixed_income",
          amountCents: 100000,
        }),
      ])
    );
  });

  it("updates an existing link and protects holding values from under-allocation", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const holding = await createInvestmentHolding(
      {
        name: "Fundo",
        assetClass: "funds",
        instrumentType: "investment_fund",
        currentValueCents: 100000,
        valueAsOf: "2026-07-16",
      },
      db
    );
    const purpose = await createInvestmentPurpose({ name: "Longo prazo" }, db);
    const allocation = await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: purpose.id,
        amountCents: 60000,
        allocatedOn: "2026-07-10",
      },
      db
    );

    const updatedAllocation = await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: purpose.id,
        amountCents: 70000,
        allocatedOn: "2026-07-14",
      },
      db
    );

    expect(updatedAllocation.id).toBe(allocation.id);
    expect(updatedAllocation.allocatedOn).toBe("2026-07-14");
    expect(
      (await db.query.investmentPurposeAllocations.findMany()).length
    ).toBe(1);

    await expect(
      upsertInvestmentPurposeAllocation(
        {
          holdingId: holding.id,
          purposeId: crypto.randomUUID(),
          amountCents: 40000,
          allocatedOn: "2026-07-16",
        },
        db
      )
    ).rejects.toMatchObject({ code: "INVESTMENT_PURPOSE_NOT_FOUND" });

    await expect(
      updateInvestmentHolding(
        {
          id: holding.id,
          currentValueCents: 69999,
        },
        db
      )
    ).rejects.toMatchObject({ code: "HOLDING_VALUE_BELOW_ALLOCATIONS" });
  });

  it("stores the new monetary fields as authenticated ciphertext", async () => {
    const { db, databaseUrl, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const holding = await createInvestmentHolding(
      {
        name: "CDB criptografado",
        assetClass: "fixed_income",
        instrumentType: "cdb",
        currentValueCents: 123456,
      },
      db
    );
    const purpose = await createInvestmentPurpose(
      {
        name: "Objetivo criptografado",
        targetAmountCents: 500000,
      },
      db
    );
    const allocation = await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: purpose.id,
        amountCents: 100000,
        allocatedOn: "2026-07-16",
      },
      db
    );

    const rawClient = createClient({ url: databaseUrl });
    try {
      const result = await rawClient.execute({
        sql: "SELECT " +
          "(SELECT typeof(current_value_cents) = 'text' AND current_value_cents LIKE 'pfc:v1:%' FROM investment_holdings WHERE id = ?) AS holding_ok, " +
          "(SELECT typeof(target_amount_cents) = 'text' AND target_amount_cents LIKE 'pfc:v1:%' FROM investment_purposes WHERE id = ?) AS purpose_ok, " +
          "(SELECT typeof(amount_cents) = 'text' AND amount_cents LIKE 'pfc:v1:%' FROM investment_purpose_allocations WHERE id = ?) AS allocation_ok",
        args: [holding.id, purpose.id, allocation.id],
      });

      expect(Object.values(result.rows[0] ?? {})).toEqual([1, 1, 1]);
    } finally {
      rawClient.close();
    }
  });

  it("archives only empty holdings and purposes without touching the global portfolio", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const holding = await createInvestmentHolding(
      {
        name: "Caixa antiga",
        assetClass: "cash",
        instrumentType: "cash",
        currentValueCents: 0,
        valueAsOf: "2026-07-16",
      },
      db
    );
    const purpose = await createInvestmentPurpose({ name: "Sem saldo" }, db);
    const beforePortfolio = await getInvestmentPortfolio(db);

    await archiveInvestmentHolding(holding.id, db);
    await archiveInvestmentPurpose(purpose.id, db);

    const dashboard = await getInvestmentPortfolioDashboard(db);
    const afterPortfolio = await getInvestmentPortfolio(db);

    expect(dashboard.holdings).toHaveLength(0);
    expect(dashboard.purposes).toHaveLength(0);
    expect(afterPortfolio).toEqual(beforePortfolio);
    expect(await db.query.transactions.findMany()).toHaveLength(0);
  });

  it("rejects allocations above the current holding value and supports removing them", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    const holding = await createInvestmentHolding(
      {
        name: "Tesouro",
        assetClass: "fixed_income",
        instrumentType: "treasury",
        currentValueCents: 100000,
        valueAsOf: "2026-07-16",
      },
      db
    );
    const purpose = await createInvestmentPurpose({ name: "Reserva" }, db);

    await expect(
      upsertInvestmentPurposeAllocation(
        {
          holdingId: holding.id,
          purposeId: purpose.id,
          amountCents: 100001,
          allocatedOn: "2026-07-16",
        },
        db
      )
    ).rejects.toMatchObject({ code: "ALLOCATION_EXCEEDS_HOLDING_VALUE" });

    const allocation = await upsertInvestmentPurposeAllocation(
      {
        holdingId: holding.id,
        purposeId: purpose.id,
        amountCents: 100000,
        allocatedOn: "2026-07-16",
      },
      db
    );
    await deleteInvestmentPurposeAllocation(allocation.id, db);

    await updateInvestmentHolding({ id: holding.id, currentValueCents: 0 }, db);
    await archiveInvestmentHolding(holding.id, db);

    expect((await db.query.investmentHoldings.findMany()).at(0)?.isArchived).toBe(true);
  });
});
