import { describe, expect, it } from "vitest";
import { checkTarget, productionFiles } from "./check-target";
import { metrics } from "./contracts";

const root = "/project";
function summary(covered = 81, total = 100, pct = (covered / total) * 100) {
  const file = Object.fromEntries(
    metrics.map((metric) => [metric, { total, covered, skipped: 0, pct }]),
  );
  return {
    total: structuredClone(file),
    "/project/lib/a.ts": structuredClone(file),
  };
}

describe("strict per-file coverage target", () => {
  it("accepts all four metrics above 80 and normalizes absolute paths", () => {
    const result = checkTarget(summary(), ["lib/a.ts"], root);
    expect(result.passed).toBe(true);
    expect(result.files["lib/a.ts"].lines).toBe(81);
  });
  it.each(metrics)(
    "rejects exactly 80%% in %s even when pct says 81",
    (metric) => {
      const report = summary();
      report["/project/lib/a.ts"][metric].covered = 80;
      report.total[metric].covered = 80;
      expect(checkTarget(report, ["lib/a.ts"], root).failures).toContain(
        `lib/a.ts: ${metric} 80/100 must exceed 80%.`,
      );
    },
  );
  it("does not round the target and accepts 80.0001 percent", () => {
    expect(
      checkTarget(summary(800001, 1000000, 80), ["lib/a.ts"], root).passed,
    ).toBe(true);
    expect(
      checkTarget(summary(799999, 1000000, 80), ["lib/a.ts"], root).passed,
    ).toBe(false);
  });
  it("marks zero executable counters as not applicable", () => {
    expect(
      checkTarget(summary(0, 0, 100), ["lib/a.ts"], root).files["lib/a.ts"]
        .branches,
    ).toBeNull();
    expect(checkTarget(summary(0, 0, 100), ["lib/a.ts"], root).passed).toBe(
      true,
    );
  });
  it.each([null, [], "bad", 42])("rejects invalid reports: %j", (input) => {
    expect(checkTarget(input, ["lib/a.ts"], root).passed).toBe(false);
  });
  it("rejects absent files, absent total, unknown files and inconsistent totals", () => {
    expect(
      checkTarget(summary(), ["lib/a.ts", "lib/b.ts"], root).failures,
    ).toContain("Missing coverage: lib/b.ts");
    expect(checkTarget({}, ["lib/a.ts"], root).failures).toContain(
      "Missing coverage: total",
    );
    expect(checkTarget(summary(), [], root).failures).toContain(
      "Unexpected coverage file: lib/a.ts",
    );
    const report = summary();
    report.total.lines.total = 99;
    expect(checkTarget(report, ["lib/a.ts"], root).failures).toContain(
      "Inconsistent total: lines.total",
    );
  });
  it.each([-1, 1.2, NaN, Infinity, 101])(
    "rejects malformed counts: %s",
    (covered) => {
      expect(checkTarget(summary(covered), ["lib/a.ts"], root).passed).toBe(
        false,
      );
    },
  );
  it("keeps the entire configured production scope including declarations and reexports", () => {
    const files = productionFiles(process.cwd());
    expect(files).toHaveLength(345);
    expect(files).toContain("lib/server/dashboard-records.ts");
    expect(files).toContain("components/finance/dashboard-category-distribution.tsx");
    expect(files).toContain("lib/interfaces/auth.ts");
    expect(files).toContain("components/finance/goals/components/index.ts");
    expect(files).toContain("proxy.ts");
    expect(files).toContain("lib/interfaces/onboarding.ts");
    expect(files).toContain("components/ui/onboarding.tsx");
  });
});
