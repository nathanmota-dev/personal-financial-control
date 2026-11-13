import { CATEGORY_CATALOG } from "@/lib/category-catalog";
import type { CategoryCatalogEntry, CategoryMarker } from "@/lib/interfaces/category-catalog";
import type { CategoryRow } from "@/lib/interfaces/components/settings-view";

/** Display order and dot colour of the category groups. */
export const CATEGORY_GROUP_DISPLAY: { group: CategoryRow["group"]; dotClassName: string }[] = [
  { group: "fixed_expense", dotClassName: "bg-chart-1" },
  { group: "variable_expense", dotClassName: "bg-chart-2" },
  { group: "income", dotClassName: "bg-chart-4" },
  { group: "investment", dotClassName: "bg-chart-3" },
];

export function normalizeCategoryName(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

const catalogIndex = new Map<string, CategoryCatalogEntry>();
for (const entry of CATEGORY_CATALOG) {
  for (const key of [entry.name, ...(entry.aliases ?? [])]) {
    const normalized = normalizeCategoryName(key);
    if (!catalogIndex.has(normalized)) catalogIndex.set(normalized, entry);
  }
}

/** Catalog entry for a category name, matching its name or any alias. */
export function findCatalogCategory(name: string) {
  return catalogIndex.get(normalizeCategoryName(name)) ?? null;
}

/** Golden-angle hues: each new index lands far from the previous ones and never repeats. */
export function distinctCategoryColor(index: number) {
  const hue = Math.round((index * 137.508 + 18) % 360);
  const lightness = 50 + (Math.floor(index / 12) % 3) * 6;
  return `hsl(${hue} 68% ${lightness}%)`;
}

/**
 * Marker for every category: catalog categories get their emoji and the others get
 * colours assigned in a stable id order, so two custom categories never share one.
 */
export function buildCategoryMarkers(categories: Pick<CategoryRow, "id" | "name">[]) {
  const markers = new Map<string, CategoryMarker>();
  let colorIndex = 0;
  for (const category of [...categories].sort((left, right) => left.id.localeCompare(right.id))) {
    const entry = findCatalogCategory(category.name);
    markers.set(category.id, entry ? { kind: "emoji", emoji: entry.emoji } : { kind: "color", color: distinctCategoryColor(colorIndex++) });
  }
  return markers;
}

/** Catalog entries the user has not created yet, by group, keeping the catalog order. */
export function suggestCatalogCategories(categories: Pick<CategoryRow, "name">[]) {
  const taken = new Set(categories.map((category) => findCatalogCategory(category.name)?.name ?? normalizeCategoryName(category.name)));
  return CATEGORY_CATALOG.filter((entry) => !taken.has(entry.name) && !taken.has(normalizeCategoryName(entry.name)));
}
