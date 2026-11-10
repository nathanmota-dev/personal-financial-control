/* eslint-disable @next/next/no-location-assign-relative-destination -- Replace the authenticated router cache after changing session credentials. */
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PinInput } from "./pin-input";
import { LogoutButton } from "./logout-button";
import type { LockFormProps } from "@/lib/interfaces/local-auth";
export function LockForm({ setup, destination, attempts }: LockFormProps) {
  const t = useTranslations("security");
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [remaining, setRemaining] = useState(5 - attempts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (setup && pin !== confirmation) { setError(t("mismatch")); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(setup ? "/api/pin" : "/api/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      if (response.status === 401) { window.location.assign("/login"); return; }
      const data = await response.json();
      if (!response.ok) {
        if (typeof data.remaining === "number") setRemaining(data.remaining);
        setPin(""); throw new Error(t("invalidPin"));
      }
      window.location.assign(destination);
    } catch (failure) { setError(failure instanceof Error ? failure.message : t("error")); setBusy(false); }
  }
  async function reset() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/session", { method: "DELETE", headers: { "x-session-intent": "pin-reset" } });
      if (!response.ok) throw new Error(t("error"));
      window.location.assign(`/login?next=${encodeURIComponent(destination)}`);
    } catch { setError(t("error")); setBusy(false); }
  }
  return <div className="space-y-6 text-center">
    <div><span aria-hidden="true" className="tone-brand tone-soft mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl"><LockKeyhole className="size-6" /></span><h1 className="text-[30px] leading-tight font-semibold tracking-[-0.04em]">{t(setup ? "setupTitle" : "lockTitle")}</h1><p className="mt-3 text-sm leading-6 text-content">{t(setup ? "setupDescription" : "lockDescription")}</p></div>
    <form className="space-y-5 [&_[data-input-otp-container]]:justify-center [&_[data-slot=input-otp-slot]]:size-12 [&_[data-slot=input-otp-slot]]:text-lg" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <PinInput label={t("pin")} value={pin} onChange={setPin} disabled={busy} />
      {setup && <PinInput label={t("confirmPin")} value={confirmation} onChange={setConfirmation} disabled={busy} />}
      {!setup && <p className="text-xs text-content-muted">{t("remaining", { count: remaining })}</p>}
      <p role="status" className="text-sm text-danger">{error}</p>
      <Button type="submit" className="h-12 w-full rounded-xl text-sm" disabled={busy || pin.length !== 6 || (setup && confirmation.length !== 6)}>{t(busy ? "saving" : setup ? "setPin" : "unlock")}</Button>
    </form>
    {!setup && <Button variant="link" onClick={reset} disabled={busy}>{t("forgotPin")}</Button>}
    <div className="border-t border-border pt-4 [&_button]:justify-center"><LogoutButton fullWidth /></div>
  </div>;
}
