import { ArrowRight, KeyRound } from "lucide-react";
import { GoogleIcon } from "@/components/auth/google-icon";
import type { LockFeaturePreviewProps } from "@/lib/interfaces/auto-carousel";

const timeouts = ["1 min", "5 min", "15 min", "30 min"] as const;
const stepClass = "flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/18 bg-white/10 px-3 py-2.5 text-xs font-medium";

/** Small illustrative strip under each lock-screen feature card. */
export function LockFeaturePreview({ variant, labels }: LockFeaturePreviewProps) {
  if (variant === "idle") return <div aria-hidden="true">
    <p className="text-[11px] text-white/65">{labels.idle}</p>
    <div className="mt-2.5 grid grid-cols-4 gap-2">{timeouts.map(value => <span key={value} className={`rounded-lg py-2 text-center text-xs font-semibold tabular-nums ${value === "5 min" ? "bg-white text-brand" : "border border-white/18 bg-white/10 text-white/80"}`}>{value}</span>)}</div>
  </div>;
  if (variant === "hash") return <div aria-hidden="true" className="flex items-center gap-2.5">
    <span className={stepClass}><span className="flex flex-col"><span className="text-[11px] font-normal text-white/65">{labels.pin}</span><span className="mt-1 tracking-[0.3em]">••••••</span></span></span>
    <ArrowRight className="size-4 shrink-0 text-white/65" />
    <span className={stepClass}><span className="flex min-w-0 flex-col"><span className="text-[11px] font-normal text-white/65">{labels.stored}</span><span className="mt-1 truncate font-mono text-[11px]">scrypt:v1:9f2c…e41a</span></span></span>
  </div>;
  return <div aria-hidden="true" className="flex items-center gap-2.5">
    <span className={stepClass}><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white [&_svg]:size-3.5"><GoogleIcon /></span><span className="truncate">{labels.google}</span></span>
    <ArrowRight className="size-4 shrink-0 text-white/65" />
    <span className={stepClass}><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20"><KeyRound className="size-3.5" /></span><span className="truncate">{labels.newPin}</span></span>
  </div>;
}
