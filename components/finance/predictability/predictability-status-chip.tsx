import type { PredictabilityStatusChipProps } from "@/app/interfaces/predictability";
import { ToneChip } from "@/components/finance/ds/tone-chip";

import { dayStatusLabels, dayStatusTones } from "./labels";

export function PredictabilityStatusChip({ status }: PredictabilityStatusChipProps) {
  return (
    <ToneChip tone={dayStatusTones[status]} dot>
      {dayStatusLabels[status]}
    </ToneChip>
  );
}
