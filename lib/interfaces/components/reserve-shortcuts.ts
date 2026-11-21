export type ReserveShortcut = { label: string; cents: number };

export type ReserveShortcutButtonsProps = {
  shortcuts: ReserveShortcut[];
  onPick: (cents: number) => void;
  className?: string;
};

/** The frame shared by the dialogs that ask where bank movements came from or went to. */
export type ReserveClassificationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: import("react").ReactNode;
  tone: "brand" | "warning";
  title: string;
  description: string;
  listClassName?: string;
  children: import("react").ReactNode;
};
