import { buildCreditCardTimelinePaths } from "@/lib/credit-card-timeline";
import type { CreditCardTimelineNode } from "@/lib/interfaces/credit-card-view";
import { cn } from "@/lib/utils";

export function CreditCardInvoiceLine({ nodes }: { nodes: CreditCardTimelineNode[] }) {
  const { solid, dashed } = buildCreditCardTimelinePaths(nodes);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      <svg className="size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        {dashed && <path d={dashed} fill="none" stroke="var(--content-subtle)" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
        {solid && <path d={solid} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
      </svg>
      {nodes.map((node) => (
        <span
          key={node.point.month}
          className={cn("absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-card", node.projected ? "border-content-subtle/60" : "border-chart-1")}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        />
      ))}
    </div>
  );
}
