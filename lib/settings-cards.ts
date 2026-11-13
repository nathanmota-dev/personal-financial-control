import { CARD_BRAND_THEMES, detectCardBrand } from "@/lib/credit-card-brands";
import { cardProductName } from "@/lib/dashboard-cards";
import type { CardBrandId, DashboardCard } from "@/lib/interfaces/dashboard-cards";
import type { SettingsCardDraft } from "@/lib/interfaces/settings";

/** Brands offered when registering a card, the generic one last. */
export const SETTINGS_CARD_BRANDS: CardBrandId[] = ["itau", "nubank", "santander", "bradesco", "bb", "inter", "mercadopago", "amex", "generic"];

/** Account name saved for a card; the brand label keeps it detectable by `detectCardBrand`. */
export function composeCardName(brand: CardBrandId, product: string) {
  const cleanProduct = product.replace(/\s+/g, " ").trim();
  if (brand === "generic") return cleanProduct;
  return [CARD_BRAND_THEMES[brand].label, cleanProduct].filter(Boolean).join(" ");
}

/** Splits a saved card name back into the brand and the product line shown in the form. */
export function parseCardName(name: string): Pick<SettingsCardDraft, "brand" | "product"> {
  const brand = detectCardBrand(name);
  return { brand, product: brand === "generic" ? name : cardProductName(name, brand) };
}

export function formatCardDay(day: string | number | null | undefined) {
  const value = Number(day);
  return Number.isInteger(value) && value >= 1 && value <= 31 ? `Dia ${String(value).padStart(2, "0")}` : "—";
}

/** Card face data for previews, without invoices. */
export function buildCardPreview(id: string, brand: CardBrandId, product: string): DashboardCard {
  const name = composeCardName(brand, product) || CARD_BRAND_THEMES[brand].label;
  return { id, name, brand, dueDate: "2000-01-01", invoices: [] };
}
