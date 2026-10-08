export const locales = ["pt", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";
export const localeCookieName = "locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "pt" || value === "en";
}

function parseAcceptLanguage(value: string): Array<{ language: string; quality: number; order: number }> {
  return value
    .split(",")
    .map((part, order) => {
      const [language = "", ...parameters] = part.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const parsedQuality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
      return {
        language: language.trim().toLowerCase(),
        quality: Number.isFinite(parsedQuality) ? Math.max(0, Math.min(1, parsedQuality)) : 0,
        order,
      };
    })
    .filter(({ language, quality }) => language.length > 0 && quality > 0)
    .sort((left, right) => right.quality - left.quality || left.order - right.order);
}

export function resolveLocale(cookieLocale: string | null, acceptLanguage: string | null): Locale {
  if (isLocale(cookieLocale)) return cookieLocale;

  for (const preference of parseAcceptLanguage(acceptLanguage ?? "")) {
    const language = preference.language.split("-")[0];
    if (language === "pt" || language === "en") return language;
  }

  return defaultLocale;
}
