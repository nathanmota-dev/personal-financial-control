import { describe, expect, it } from "vitest";

import { formatMoneyInput, moneyInputToCents } from "@/lib/finance-ui";

describe("finance UI money inputs", () => {
  it("parses Brazilian currency values with a visible currency prefix", () => {
    expect(moneyInputToCents("R$ 120,00")).toBe(12000);
    expect(moneyInputToCents("120.00")).toBe(12000);
    expect(moneyInputToCents("1.200,50")).toBe(120050);
  });

  it("formats values for a BRL input without including the visual prefix", () => {
    expect(formatMoneyInput("120")).toBe("120,00");
    expect(formatMoneyInput("1.200,5")).toBe("1.200,50");
  });
});
