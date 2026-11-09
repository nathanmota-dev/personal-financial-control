import type { AccountRow } from "@/lib/interfaces/components/settings-view";
import type { PluggyAccountRow, PluggyItemView, PluggyLinkDraft, PluggySyncRunView } from "@/lib/interfaces/pluggy";

export type OpenFinanceSettingsProps = { configured: boolean; accounts: AccountRow[] };
export type OpenFinanceWorkspaceProps = { accounts: AccountRow[] };
export type OpenFinanceItemFormProps = { busy: boolean; onAdd: (externalItemId: string, label: string) => Promise<boolean> };
export type OpenFinanceSyncPanelProps = { run: PluggySyncRunView | null; syncing: boolean; onSync: () => void };
export type OpenFinanceRunSummaryProps = { run: PluggySyncRunView };
export type OpenFinanceRemoveItemProps = { label: string; busy: boolean; onRemove: () => void };

export type OpenFinanceItemCardProps = {
  item: PluggyItemView;
  rows: PluggyAccountRow[];
  accounts: AccountRow[];
  busy: boolean;
  onRemove: (id: string) => void;
  onSaveLink: (itemId: string, row: PluggyAccountRow, draft: PluggyLinkDraft) => void;
};

export type OpenFinanceLinkRowProps = {
  row: PluggyAccountRow;
  accounts: AccountRow[];
  busy: boolean;
  onSave: (row: PluggyAccountRow, draft: PluggyLinkDraft) => void;
};
