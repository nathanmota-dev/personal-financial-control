import type { ComponentProps, ReactNode } from "react";

import type { TableRow } from "@/components/ui/table";

export type DetailSheetHeader = {
  title: ReactNode;
  description: ReactNode;
  addon?: ReactNode;
};

export type DetailSheetProps = {
  header: DetailSheetHeader | null;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
};

export type DayViewMode = "calendar" | "table";

export type DayViewTabsProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  /** Shown between the header and the active view, for both views. */
  notice?: ReactNode;
  calendar: ReactNode;
  table: ReactNode;
  children?: ReactNode;
};

export type ClickableTableRowProps = ComponentProps<typeof TableRow> & {
  onActivate: () => void;
};
