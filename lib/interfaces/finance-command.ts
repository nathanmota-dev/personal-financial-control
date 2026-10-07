import type { LucideIcon } from "lucide-react";

export type FinanceCommandActionId =
  | "new-income"
  | "new-expense"
  | "new-transfer"
  | "new-credit-card-purchase"
  | "new-account"
  | "new-category"
  | "new-goal";

export type FinanceCommandIntent = {
  action: FinanceCommandActionId;
  id: string;
};

export type FinanceCommandActionDefinition = {
  id: FinanceCommandActionId;
  label: string;
  description: string;
  href: string;
  aliases: readonly string[];
};

export type FinanceCommandTriggerProps = {
  onOpen: () => void;
  compact?: boolean;
  showShortcut?: boolean;
  className?: string;
};

export type FinanceCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type FinancePageDestination = {
  href: string;
  label: string;
  aliases: readonly string[];
  icon: LucideIcon;
};

export type FinanceCommandResultsProps = {
  pages: FinancePageDestination[];
  actions: readonly FinanceCommandActionDefinition[];
  onNavigate: (href: string) => void;
  onRunAction: (action: FinanceCommandActionDefinition) => void;
};
