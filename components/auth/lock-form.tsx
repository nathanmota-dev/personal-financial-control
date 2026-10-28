/* eslint-disable @next/next/no-location-assign-relative-destination -- Replace the authenticated router cache after changing session credentials. */
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
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
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold tracking-tight">{t(setup ? "setupTitle" : "lockTitle")}</h1><p className="mt-2 text-sm text-content-muted">{t(setup ? "setupDescription" : "lockDescription")}</p></div>
    <form className="space-y-5" onSubmit={event => { event.preventDefault(); void submit(); }}>
      <PinInput label={t("pin")} value={pin} onChange={setPin} disabled={busy} />
      {setup && <PinInput label={t("confirmPin")} value={confirmation} onChange={setConfirmation} disabled={busy} />}
      {!setup && <p className="text-xs text-content-muted">{t("remaining", { count: remaining })}</p>}
      <p role="status" className="text-sm text-danger">{error}</p>
      <Button type="submit" className="w-full" disabled={busy || pin.length !== 6 || (setup && confirmation.length !== 6)}>{t(busy ? "saving" : setup ? "setPin" : "unlock")}</Button>
    </form>
    {!setup && <Button variant="link" onClick={reset} disabled={busy}>{t("forgotPin")}</Button>}
    <LogoutButton fullWidth />
  </div>;
}
