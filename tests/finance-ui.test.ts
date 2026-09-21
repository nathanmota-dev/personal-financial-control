import { describe, expect, it } from "vitest";

import {
  appendDigitToMoneyInput,
  formatMoneyInput,
  moneyInputToCents,
  removeDigitFromMoneyInput,
} from "@/lib/finance-ui";

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

  it("formats raw calculator amounts with Brazilian thousands and decimal separators", () => {
    expect(formatMoneyInput("50000")).toBe("50.000,00");
    expect(formatMoneyInput("1100")).toBe("1.100,00");
    expect(formatMoneyInput("50.000,00")).toBe("50.000,00");
  });

  it("formats calculator currency while each digit is entered", () => {
    let value = "";

    for (const digit of "10000") {
      value = appendDigitToMoneyInput(value, digit);
    }

    expect(value).toBe("10.000,00");
    expect(removeDigitFromMoneyInput(value)).toBe("1.000,00");
    expect(appendDigitToMoneyInput(value, "4", true)).toBe("4,00");
    expect(removeDigitFromMoneyInput(value, true)).toBe("");
  });
});
