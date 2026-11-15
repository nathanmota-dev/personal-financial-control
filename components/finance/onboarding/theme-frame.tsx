import type { OnboardingThemeFrameProps } from "@/lib/interfaces/onboarding";
import { cn } from "@/lib/utils";

/** `light`/`dark` scope the design tokens; use tokens the `.dark` block redeclares (not derived ones such as `--card`). */
export function OnboardingThemeFrame({ mode }: OnboardingThemeFrameProps) {
  return <div aria-hidden className={cn(mode, "flex h-[72px] w-full overflow-hidden rounded-[10px] bg-hero")}>
    <div className="flex w-4 shrink-0 flex-col items-center gap-1 pt-2">
      <span className="h-1 w-2 rounded-full bg-white/80" /><span className="h-1 w-2 rounded-full bg-white/40" /><span className="h-1 w-2 rounded-full bg-white/40" />
    </div>
    <div className="my-1 mr-1 flex flex-1 flex-col gap-1 rounded-[7px] bg-surface p-1.5">
      <span className="h-1.5 w-8 rounded-full bg-content-strong" />
      <div className="grid flex-1 grid-cols-[3fr_2fr] gap-1">
        <div className="flex flex-col justify-end gap-0.5 rounded-[5px] border border-border bg-surface-raised p-1">
          <span className="h-1 w-6 rounded-full bg-content-subtle" />
          <span className="h-1 w-full rounded-full bg-primary" />
        </div>
        <div className="rounded-[5px] border border-border bg-surface-raised p-1"><span className="block size-3 rounded-full border-2 border-chart-2" /></div>
      </div>
    </div>
  </div>;
}
