import { afterEach, expect, it, vi } from "vitest";
import { getReportInitial, getReportView } from "@/lib/server/reports";
import { readDashboardRecords } from "@/lib/server/dashboard-records";
import type { AppDb } from "@/lib/db";

vi.mock("@/lib/server/dashboard-records", () => ({ readDashboardRecords: vi.fn() }));
const db = {} as AppDb;
afterEach(() => vi.clearAllMocks());

it("loads only the current year for the initial view without requesting comparison data", async () => {
  vi.mocked(readDashboardRecords).mockResolvedValue({ activeTransactions: [], expenses: [], installments: [] });
  const initial = await getReportInitial({ mode: "monthly", period: "2026-01" }, db, "2026-02-01");
  expect(readDashboardRecords).toHaveBeenCalledWith(["2026-01", "2026-02"], db);
  expect(initial.series).toHaveLength(2);
  expect(initial).not.toHaveProperty("categories");
  expect(initial).not.toHaveProperty("entries");
  expect(initial.entryCount).toBe(0);
  expect(initial.pending).toEqual({ count: 0, amountCents: 0 });
});
it("only categories query the comparison period; origins query the selected period", async () => {
  vi.mocked(readDashboardRecords).mockResolvedValue({ activeTransactions: [], expenses: [], installments: [] });
  await getReportView({ mode: "monthly", period: "2026-01" }, "categories", db, "2026-02-01");
  expect(readDashboardRecords).toHaveBeenLastCalledWith(["2026-01", "2025-12"], db);
  await getReportView({ mode: "monthly", period: "2026-01" }, "sources", db, "2026-02-01");
  expect(readDashboardRecords).toHaveBeenLastCalledWith(["2026-01"], db);
});
it("bounds annual queries and preserves empty future years", async () => {
  vi.mocked(readDashboardRecords).mockResolvedValue({ activeTransactions: [], expenses: [], installments: [] });
  await getReportView({ mode: "annual", period: "2026" }, "categories", db, "2026-02-01");
  expect(vi.mocked(readDashboardRecords).mock.calls[0][0]).toEqual(["2026-01", "2026-02", ...Array.from({ length: 12 }, (_, index) => `2025-${String(index + 1).padStart(2, "0")}`)]);
  const initial = await getReportInitial({ mode: "annual", period: "2027" }, db, "2026-02-01");
  expect(initial.series).toEqual([]);
  expect(await getReportView({ mode: "annual", period: "2027" }, "sources", db, "2026-02-01")).toEqual({ entries: [] });
});
