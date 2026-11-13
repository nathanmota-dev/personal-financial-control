"use client";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import type { PinInputProps } from "@/lib/interfaces/local-auth";

const tileSlot = "h-[58px] min-w-0 flex-1 rounded-[14px] border border-border bg-card text-xl font-semibold text-content-strong shadow-none first:rounded-[14px] first:border-l last:rounded-[14px] dark:bg-card data-[active=true]:border-primary data-[active=true]:ring-primary/20";

/** Six-digit PIN field, masked by default; the eye button reveals the digits. */
export function PinInput({ label, value, onChange, disabled, size = "default" }: PinInputProps) {
  const t = useTranslations("security");
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const large = size === "lg";
  const toggleLabel = t(revealed ? "hidePin" : "showPin");
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className={large ? "text-[10px] font-bold tracking-wider text-content uppercase" : "text-sm font-medium"}>{label}</label>
      <Button type="button" variant="ghost" size="icon-sm" className="-my-1 rounded-full text-content hover:text-content-strong" aria-label={`${toggleLabel}: ${label}`} title={toggleLabel} aria-pressed={revealed} onClick={() => setRevealed(current => !current)}>
        {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
    <InputOTP id={id} aria-label={label} maxLength={6} pattern="^[0-9]*$" inputMode="numeric" autoComplete="off" value={value} onChange={onChange} disabled={disabled} containerClassName={large ? "w-full" : undefined}>
      {/* The mask lives on the group: tailwind-merge would drop it next to the slot's text color. */}
      <InputOTPGroup className={cn(!revealed && "text-security-disc", large && "w-full gap-2")}>{Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} className={large ? tileSlot : undefined} />)}</InputOTPGroup>
    </InputOTP>
  </div>;
}
