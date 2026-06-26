import type { StatusBadgeProps } from "@/app/interfaces/projected-balance";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { getStatusTone, statusLabels } from "./labels";

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={cn("ring-1", getStatusTone(status))}>
      {statusLabels[status]}
    </Badge>
  );
}
