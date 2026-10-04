import { Badge } from "@/components/ui/badge";
import type { StatusDotBadgeProps } from "@/lib/interfaces/finance-fields";
import { cn } from "@/lib/utils";
export function StatusDotBadge({
  children,
  tone,
  className,
}: StatusDotBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 bg-transparent text-foreground", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full bg-current",
          tone.split(" ").filter((token) => token.startsWith("text-")),
        )}
      />
      {children}
    </Badge>
  );
}
