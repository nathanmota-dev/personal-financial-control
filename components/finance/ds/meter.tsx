import { toneClass } from "@/lib/finance-tone";
import type { MeterProps } from "@/lib/interfaces/design-system";
import { cn } from "@/lib/utils";

const sizes = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };

/** Decorative progress bar; pair it with visible text or use Progress for an accessible value. */
export function Meter({ value, tone = "brand", striped = false, size = "md", className }: MeterProps) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div aria-hidden="true" className={cn("relative w-full overflow-hidden rounded-full", striped ? "tone-stripes" : "tone-track", toneClass(tone), sizes[size], className)}>
      <div className="tone-fill h-full rounded-full transition-[width] duration-500" style={{ width: `${width}%` }} />
    </div>
  );
}
