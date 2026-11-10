import type { HeroStatProps } from "@/lib/interfaces/design-system";

export function HeroStat({ label, value, icon, hint }: HeroStatProps) {
  return (
    <div data-slot="card" className="min-w-0 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <p className="flex items-center gap-1.5 text-xs font-medium text-white/75 [&>svg]:size-3.5">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-lg leading-6 font-semibold tracking-tight break-words tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] leading-4 text-white/65">{hint}</p>}
    </div>
  );
}
