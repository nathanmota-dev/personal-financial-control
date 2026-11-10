import { toneClass } from "@/lib/finance-tone";
import type { RingProgressProps } from "@/lib/interfaces/design-system";
import { cn } from "@/lib/utils";

export function RingProgress({ value, tone = "brand", size = 72, stroke = 8, children, className }: RingProgressProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", toneClass(tone), className)} style={{ width: size, height: size }}>
      <svg aria-hidden="true" width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-current opacity-15" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress / 100)}
          className="stroke-current transition-[stroke-dashoffset] duration-500"
          style={{ color: "var(--tone)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-content-strong tabular-nums">{children}</span>
    </div>
  );
}
