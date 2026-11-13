import type { CategoryRow } from "@/lib/interfaces/components/settings-view";

export type CategoryCatalogEntry = {
  name: string;
  group: CategoryRow["group"];
  emoji: string;
  /** Other names that should resolve to this entry (lower-case, accent-free). */
  aliases?: string[];
};

/** How a category is drawn: a catalog emoji, or a distinct colour for custom ones. */
export type CategoryMarker = { kind: "emoji"; emoji: string } | { kind: "color"; color: string };
