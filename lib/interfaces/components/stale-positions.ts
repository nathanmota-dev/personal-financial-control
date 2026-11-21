import type { StalePosition } from "@/lib/interfaces/stale-positions";

export type StalePositionsNoticeProps = { positions: StalePosition[] };

export type StalePositionsDialogProps = {
  positions: StalePosition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type StalePositionRowProps = { position: StalePosition };

export type StalePositionSubmitContext = {
  holdingId: string;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
};
