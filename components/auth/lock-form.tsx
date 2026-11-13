/* eslint-disable @next/next/no-location-assign-relative-destination -- Replace the authenticated router cache after changing session credentials. */
"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PinInput } from "./pin-input";
import { LockAttempts } from "./lock-attempts";
import { LockUserCard } from "./lock-user-card";
import { LogoutButton } from "./logout-button";
import type { LockFormProps } from "@/lib/interfaces/local-auth";

const MAX_ATTEMPTS = 5;

export function LockForm({ setup, destination, attempts, user }: LockFormProps) {
  const t = useTranslations("security");
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [remaining, setRemaining] = useState(MAX_ATTEMPTS - attempts);
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
  return <div className="w-full">
    <header>
      <h1 className="text-[35px] leading-[44px] font-semibold tracking-[-1px] text-content-strong">{t(setup ? "setupTitle" : "lockTitle")}</h1>
      <p className="mt-2 text-xs text-content">{t(setup ? "setupDescription" : "lockDescription")}</p>
    </header>
    <section className="mt-6 min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <div className="flex items-center justify-between gap-4">
        <LockUserCard user={user} />
        {/* Below lg the brand panel is hidden, so the card carries the illustration. */}
        <div aria-hidden="true" className="relative -my-3 -mr-2 size-[72px] shrink-0 lg:hidden">
          <div className="absolute inset-x-2 -bottom-1 h-4 rounded-[50%] bg-black/50 blur-[7px]" />
          <Image src="/images/lock-padlock.webp" width={450} height={450} alt="" unoptimized className="relative size-full object-contain" />
        </div>
      </div>
      <form className="mt-6 space-y-5 border-t border-border pt-5" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <PinInput size="lg" label={t("pin")} value={pin} onChange={setPin} disabled={busy} />
        {setup && <PinInput size="lg" label={t("confirmPin")} value={confirmation} onChange={setConfirmation} disabled={busy} />}
        {!setup && <LockAttempts remaining={remaining} total={MAX_ATTEMPTS} />}
        <p role="status" className="text-xs font-medium text-destructive empty:sr-only">{error}</p>
        <Button type="submit" className="w-full" disabled={busy || pin.length !== 6 || (setup && confirmation.length !== 6)}><KeyRound aria-hidden="true" />{t(busy ? "saving" : setup ? "setPin" : "unlock")}</Button>
      </form>
      <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between [&_button]:justify-center">
        {!setup && <Button variant="ghost" onClick={reset} disabled={busy} className="text-primary hover:text-primary">{t("forgotPin")}</Button>}
        <div className={setup ? "w-full" : "sm:ml-auto"}><LogoutButton fullWidth /></div>
      </div>
    </section>
  </div>;
}
