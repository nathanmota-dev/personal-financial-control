import type { StatusDotBadgeProps } from "@/lib/interfaces/finance-fields";
import { cn } from "@/lib/utils";

/** Soft tinted status pill: the dot and tint both follow the text tone passed in. */
export function StatusDotBadge({
  children,
  tone,
  className,
}: StatusDotBadgeProps) {
  const text = tone.split(" ").filter((token) => token.startsWith("text-"));
  return (
    <span
      data-slot="badge"
      className={cn(
        "relative inline-flex h-6 w-fit shrink-0 items-center gap-1.5 overflow-hidden rounded-lg px-2 text-xs font-medium whitespace-nowrap",
        text,
        className,
      )}
    >
      <span aria-hidden="true" className="absolute inset-0 bg-current opacity-[0.13]" />
      <span aria-hidden="true" className="relative size-1.5 shrink-0 rounded-full bg-current" />
      <span className="relative">{children}</span>
    </span>
  );
}
