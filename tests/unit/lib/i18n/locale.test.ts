import englishMessages from "@/public/i18n/en.json";
import portugueseMessages from "@/public/i18n/pt.json";
import { describe, expect, it } from "vitest";

import { defaultLocale, isLocale, resolveLocale } from "@/lib/i18n/locale";

describe("locale resolution", () => {
  it("uses a supported saved preference before the browser header", () => {
    expect(resolveLocale("en", "pt-BR,pt;q=0.9")).toBe("en");
    expect(resolveLocale("pt", "en-US,en;q=0.9")).toBe("pt");
  });

  it.each([
    ["en-US,en;q=0.9", "en"],
    ["en-GB", "en"],
    ["pt-BR,pt;q=0.9", "pt"],
    ["pt-PT", "pt"],
    ["fr-FR,pt-BR;q=0.8", "pt"],
    ["fr-FR", "pt"],
    ["en;q=0,pt;q=0", "pt"],
  ])("resolves %s to %s", (header, expected) => {
    expect(resolveLocale(null, header)).toBe(expected);
  });

  it("uses Portuguese when the preference cookie is invalid", () => {
    expect(resolveLocale("fr", null)).toBe(defaultLocale);
  });

  it("recognizes only the supported base locales", () => {
    expect(isLocale("pt")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("en-US")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});

describe("translation catalogs", () => {
  it("keep the same keys in Portuguese and English", () => {
    const keys = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(keys);
      if (!value || typeof value !== "object") return typeof value;
      return Object.fromEntries(
        Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, keys(child)]),
      );
    };

    expect(keys(englishMessages)).toEqual(keys(portugueseMessages));
  });
});
