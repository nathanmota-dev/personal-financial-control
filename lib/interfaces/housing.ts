import type { DashboardHousingData } from "@/lib/interfaces/dashboard-housing";
import type { TransactionAccountOption, TransactionCategoryOption } from "@/lib/interfaces/transactions";

export type HousingEntry = {
  id: string;
  description: string;
  date: string;
  amountCents: number;
  accountName: string | null;
};

export type HousingTemplate = {
  id: string;
  description: string;
  dayOfMonth: number;
  amountCents: number;
};

export type HousingViewData = {
  month: string;
  housing: DashboardHousingData;
  /** Housing expenses of the month, newest first. */
  entries: HousingEntry[];
  /** Active recurring housing expenses, by due day. */
  templates: HousingTemplate[];
};

export type HousingViewProps = HousingViewData & {
  accounts: TransactionAccountOption[];
  /** Only the housing categories: the dialogs register everything under them. */
  categories: TransactionCategoryOption[];
};

export type HousingEntriesProps = { entries: HousingEntry[] };

export type HousingTemplatesProps = { templates: HousingTemplate[] };

export type HousingMonthPickerProps = { month: string };
