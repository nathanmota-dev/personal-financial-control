import { toneClass } from "@/lib/finance-tone";
import type { ToneChipProps } from "@/lib/interfaces/design-system";
import { cn } from "@/lib/utils";

export function ToneChip({ tone = "neutral", icon, dot = false, children, className }: ToneChipProps) {
  return (
    <span
      className={cn(
        "tone-soft inline-flex h-6 w-fit max-w-full shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium whitespace-nowrap [&>svg]:size-3 [&>svg]:shrink-0",
        toneClass(tone),
        className,
      )}
    >
      {dot && <span aria-hidden="true" className="tone-fill size-1.5 shrink-0 rounded-full" />}
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}
