import type { CardChipProps } from "@/lib/interfaces/dashboard-cards";
import { cn } from "@/lib/utils";

export function CreditCardChip({ className }: CardChipProps) {
  return (
    <svg viewBox="0 0 36 28" aria-hidden className={cn("h-[28px] w-[36px]", className)}>
      <rect x="1" y="1" width="34" height="26" rx="6" fill="currentColor" opacity="0.88" />
      <g stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" fill="none">
        <path d="M1 10h10M1 18h10M25 10h10M25 18h10" />
        <path d="M11 1v26M25 1v26M11 14h14" />
        <rect x="11" y="8" width="14" height="12" rx="3" />
      </g>
    </svg>
  );
}
