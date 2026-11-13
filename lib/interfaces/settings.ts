import type { ReactNode } from "react";

import type { CategoryCatalogEntry, CategoryMarker } from "@/lib/interfaces/category-catalog";
import type { AccountRow, CategoryRow } from "@/lib/interfaces/components/settings-view";
import type { CardBrandId, DashboardCard } from "@/lib/interfaces/dashboard-cards";

export type SettingsCardDraft = {
  brand: CardBrandId;
  product: string;
  closingDay: string;
  dueDay: string;
};

export type SettingsAccountsPanelProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  newLabel: string;
  illustrationSrc: string;
  accounts: AccountRow[];
  allowedTypes: AccountRow["type"][];
};

export type SettingsAccountRowProps = { account: AccountRow; allowedTypes: AccountRow["type"][] };

export type SettingsCardsPanelProps = { cards: AccountRow[] };

export type SettingsCardFormProps = {
  card: AccountRow | null;
  onDone: () => void;
};

export type SettingsCardBrandPickerProps = {
  value: CardBrandId;
  onChange: (brand: CardBrandId) => void;
};

export type SettingsCardTileProps = {
  card: AccountRow;
  editing: boolean;
  onEdit: () => void;
};

export type SettingsCardPreviewProps = { card: DashboardCard; closingDay: string; dueDay: string };

export type SettingsCategoriesPanelProps = { categories: CategoryRow[] };

export type SettingsCategoryRowProps = { category: CategoryRow; dotClassName: string; marker: CategoryMarker | undefined };

export type SettingsCategorySuggestionsProps = { categories: CategoryRow[] };

export type SettingsCategorySuggestionProps = { entry: CategoryCatalogEntry };

export type SettingsArchiveButtonProps = { id: string; label?: ReactNode };

export type SettingsReservePanelProps = { projection: import("@/lib/interfaces/investments").InvestmentProjection | null };
