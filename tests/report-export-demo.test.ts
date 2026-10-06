import { afterEach, expect, it, vi } from "vitest";
import { GET } from "@/app/api/reports/export/route";
import { getReportInitial, getReportView } from "@/lib/server/reports";
import { csvCents, parseReportCsv } from "@/tests/helpers/report-csv";

afterEach(() => vi.unstubAllEnvs());

it("exports only demo fixtures even when the real database configuration is unusable", async () => {
  vi.stubEnv("DEMO_MODE", "true");
  vi.stubEnv("DATABASE_URL", "file:/unavailable-private-database/finance.db");
  const selection = { mode: "monthly", period: "2026-07" } as const;
  const initial = await getReportInitial(selection);
  const categories = await getReportView(selection, "categories");
  const summaryResponse = await GET(new Request("http://localhost/api/reports/export?mode=monthly&period=2026-07&kind=summary"));
  const categoryResponse = await GET(new Request("http://localhost/api/reports/export?mode=monthly&period=2026-07&kind=categories"));
  expect(summaryResponse.status).toBe(200);
  expect(categoryResponse.status).toBe(200);
  const row = parseReportCsv(await summaryResponse.text())[1];
  const month = initial.series.find((row) => row.month === "2026-07")!;
  expect(csvCents(row[1])).toBe(month.metrics.incomeCents);
  expect(csvCents(row[2])).toBe(month.metrics.expenseCents);
  expect(csvCents(row[1])).toBeGreaterThan(0);
  const exported = parseReportCsv(await categoryResponse.text()).slice(1);
  expect(categories.categories).toBeDefined();
  expect(exported.map((row) => row[1]).sort()).toEqual(categories.categories!.filter((row) => row.type === "expense" && row.amountCents !== 0).map((row) => row.id).sort());
});
