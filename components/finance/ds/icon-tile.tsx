import { toneClass } from "@/lib/finance-tone";
import type { IconTileProps } from "@/lib/interfaces/design-system";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-8 rounded-[10px] [&>svg]:size-4",
  md: "size-10 rounded-xl [&>svg]:size-[18px]",
  lg: "size-12 rounded-2xl [&>svg]:size-5",
};

export function IconTile({ tone = "brand", size = "md", children, className }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("tone-soft inline-flex shrink-0 items-center justify-center text-sm font-semibold", toneClass(tone), sizes[size], className)}
    >
      {children}
    </span>
  );
}
