import { describe, expect, it } from "vitest";

import { CATEGORY_CATALOG } from "@/lib/category-catalog";
import { buildCategoryMarkers, distinctCategoryColor, findCatalogCategory, normalizeCategoryName, suggestCatalogCategories } from "@/lib/category-markers";
import { buildCardPreview, composeCardName, formatCardDay, parseCardName } from "@/lib/settings-cards";

describe("settings cards", () => {
  it("keeps the brand in the saved name so it can be detected again", () => {
    expect(composeCardName("itau", "  Click ")).toBe("Itaú Click");
    expect(composeCardName("nubank", "")).toBe("Nubank");
    expect(composeCardName("generic", "Visa Platinum")).toBe("Visa Platinum");
    expect(parseCardName("Itaú Click")).toEqual({ brand: "itau", product: "Click" });
    expect(parseCardName("Visa Platinum")).toEqual({ brand: "generic", product: "Visa Platinum" });
  });

  it("formats valid days and builds an invoice-free preview", () => {
    expect(formatCardDay("7")).toBe("Dia 07");
    expect(formatCardDay("32")).toBe("—");
    expect(formatCardDay("")).toBe("—");
    expect(buildCardPreview("new", "santander", "")).toMatchObject({ name: "Santander", brand: "santander", invoices: [] });
  });
});

describe("category catalog", () => {
  it("has unique names and no alias shared by two entries", () => {
    const keys = CATEGORY_CATALOG.flatMap((entry) => [entry.name, ...(entry.aliases ?? [])].map((key) => `${normalizeCategoryName(key)}`));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("finds entries by name or alias, ignoring case and accents", () => {
    expect(findCatalogCategory("ENERGIA ELETRICA")?.emoji).toBe("⚡");
    expect(findCatalogCategory("gasolina")?.name).toBe("Postos de combustível");
    expect(findCatalogCategory("Coisas do sítio")).toBeNull();
  });

  it("gives catalog categories their emoji and custom ones distinct colours", () => {
    const markers = buildCategoryMarkers([
      { id: "a", name: "Moradia" },
      { id: "b", name: "Sítio" },
      { id: "c", name: "Coleção de vinis" },
    ]);
    expect(markers.get("a")).toEqual({ kind: "emoji", emoji: "🏠" });
    expect(markers.get("b")).toEqual({ kind: "color", color: distinctCategoryColor(0) });
    expect(markers.get("c")).toEqual({ kind: "color", color: distinctCategoryColor(1) });
    const colors = Array.from({ length: 60 }, (_, index) => distinctCategoryColor(index));
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("suggests only catalog entries the user has not created", () => {
    const names = suggestCatalogCategories([{ name: "mercado" }, { name: "Salário" }]).map((entry) => entry.name);
    expect(names).not.toContain("Supermercado");
    expect(names).not.toContain("Salário");
    expect(names).toContain("Delivery");
  });
});
