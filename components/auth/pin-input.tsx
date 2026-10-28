"use client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import type { PinInputProps } from "@/lib/interfaces/local-auth";
export function PinInput({ label, value, onChange, disabled }: PinInputProps) {
  return <div className="space-y-2"><label className="text-sm font-medium">{label}
    <InputOTP aria-label={label} maxLength={6} pattern="^[0-9]*$" inputMode="numeric" autoComplete="off" value={value} onChange={onChange} disabled={disabled} containerClassName="mt-2">
      <InputOTPGroup>{Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} className="text-security-disc" />)}</InputOTPGroup>
    </InputOTP>
  </label></div>;
}
