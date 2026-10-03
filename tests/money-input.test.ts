import { describe, expect, it } from "vitest";
import { maskMoneyInput, formatPastedMoney } from "@/lib/money-input";
import { moneyInputToCents } from "@/lib/finance-ui";

describe("shared monetary input", () => {
  it("formats typed cents and grouping without changing the submitted amount", () => {
    expect(maskMoneyInput("1")).toBe("0,01");
    expect(maskMoneyInput("0,012")).toBe("0,12");
    expect(maskMoneyInput("123456")).toBe("1.234,56");
    expect(moneyInputToCents(maskMoneyInput("123456"))).toBe(123456);
  });
  it("supports clearing, zero and negative initial balances", () => {
    expect(maskMoneyInput("")).toBe("");
    expect(maskMoneyInput("-")).toBe("-");
    expect(maskMoneyInput("000")).toBe("0,00");
    expect(maskMoneyInput("-123456")).toBe("-1.234,56");
  });
  it("preserves pasted decimal amounts and rejects non-monetary text", () => {
    expect(formatPastedMoney("R$ 1.234,56")).toBe("1.234,56");
    expect(formatPastedMoney("1234.56")).toBe("1.234,56");
    expect(formatPastedMoney("1234")).toBe("1.234,00");
    expect(formatPastedMoney("abc")).toBe("");
  });
});
