import type { TransactionsFlowBarProps } from "@/lib/interfaces/transactions";
import { cn } from "@/lib/utils";

export function TransactionsFlowBar({ segments }: TransactionsFlowBarProps) {
  return (
    <div data-testid="transactions-flow-bar" className="mt-6 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface">
      {segments.map((segment) => (
        <div key={segment.key} className={cn("h-full", segment.colorClassName)} style={{ width: `${segment.width}%` }} />
      ))}
    </div>
  );
}
