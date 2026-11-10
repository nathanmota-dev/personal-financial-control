import { ToneChip } from "@/components/finance/ds/tone-chip";
import { toneForKey } from "@/lib/finance-tone";
import type { CategoryChipProps } from "@/lib/interfaces/design-system";
import { cn } from "@/lib/utils";
import { CircleDashed, Tag } from "lucide-react";

export function CategoryChip({ name, className }: CategoryChipProps) {
  if (!name) {
    return (
      <span className={cn("inline-flex h-6 w-fit items-center gap-1.5 rounded-lg border border-dashed border-border px-2 text-xs font-medium whitespace-nowrap text-content-muted", className)}>
        <CircleDashed className="size-3" aria-hidden="true" />
        Sem categoria
      </span>
    );
  }
  return (
    <ToneChip tone={toneForKey(name)} icon={<Tag aria-hidden="true" />} className={className}>
      <span data-user-content>{name}</span>
    </ToneChip>
  );
}
