import { describe, expect, it } from "vitest";

import { buildCategoryChartData } from "@/lib/category-spending";

describe("category spending chart data", () => {
  it("sorts positive categories, limits the result to six, and formats chart values", () => {
    const data = buildCategoryChartData(
      Array.from({ length: 7 }, (_, index) => ({
        categoryId: `category-${index}`,
        categoryName:
          index === 6 ? "Uma categoria com nome muito comprido" : `Categoria ${index}`,
        amountCents: (index + 1) * 1000,
      })).concat({
        categoryId: "zero",
        categoryName: "Sem gasto",
        amountCents: 0,
      })
    );

    expect(data).toHaveLength(6);
    expect(data[0]).toMatchObject({
      categoryId: "category-6",
      amount: 70,
      fill: "#38bdf8",
      shortLabel: "Uma categoria com...",
    });
    expect(data.some((item) => item.categoryId === "zero")).toBe(false);
  });

  it("returns no chart data when every amount is zero or negative", () => {
    expect(
      buildCategoryChartData([
        { categoryId: "zero", categoryName: "Zero", amountCents: 0 },
        { categoryId: "negative", categoryName: "Negativo", amountCents: -1 },
      ])
    ).toEqual([]);
  });
});
