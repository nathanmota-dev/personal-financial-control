"use client";
import { useTranslations } from "next-intl";
import { Slider } from "@/components/ui/slider";
import { lockTimeoutOptions, nearestLockTimeoutIndex } from "@/lib/auth/lock-timeout";
import type { LockTimeoutSliderProps } from "@/lib/interfaces/local-auth";
export function LockTimeoutSlider({ value, onChange, disabled }: LockTimeoutSliderProps) {
  const t = useTranslations("security");
  const describe = (minutes: number) => minutes ? t("minutes", { count: minutes }) : t("never");
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-medium text-content-strong">{t("timeout")}</span>
      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-content-strong">{describe(value)}</span>
    </div>
    <Slider min={0} max={lockTimeoutOptions.length - 1} step={1} value={[nearestLockTimeoutIndex(value)]} disabled={disabled}
      onValueChange={([index]) => onChange(lockTimeoutOptions[index])} thumbLabel={t("timeout")} getValueText={index => describe(lockTimeoutOptions[index])} />
    {/* Fixed thumb-width labels keep each tick centered under the inset Radix thumb. */}
    <div aria-hidden className="flex justify-between text-[11px] tabular-nums text-content-muted">
      {lockTimeoutOptions.map(minutes => <span key={minutes} className="w-4 text-center">{minutes}</span>)}
    </div>
  </div>;
}
