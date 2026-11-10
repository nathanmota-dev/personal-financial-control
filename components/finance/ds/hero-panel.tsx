import type { HeroPanelProps } from "@/lib/interfaces/design-system";
import { cn } from "@/lib/utils";

export function HeroPanel({ eyebrow, value, caption, badge, children, aside, className }: HeroPanelProps) {
  return (
    <section
      aria-label={eyebrow}
      data-slot="card"
      className={cn("bg-hero shadow-elevation relative flex min-w-0 flex-col gap-5 overflow-hidden rounded-[24px] p-6 sm:p-7 lg:flex-row lg:items-stretch lg:justify-between", className)}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-white/75 uppercase">{eyebrow}</p>
            {badge}
          </div>
          <p className="mt-2 text-[34px] leading-[1.1] font-semibold tracking-[-1.2px] break-words tabular-nums sm:text-[42px]">{value}</p>
          {caption && <p className="mt-2 max-w-xl text-sm leading-5 text-white/80">{caption}</p>}
        </div>
        {children && <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">{children}</div>}
      </div>
      {aside && <div className="flex min-w-0 shrink-0 lg:w-[320px]">{aside}</div>}
    </section>
  );
}
