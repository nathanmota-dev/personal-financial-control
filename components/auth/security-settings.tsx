"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { lockTimeoutOptions, nearestLockTimeoutIndex } from "@/lib/auth/lock-timeout";
import { LockTimeoutSlider } from "./lock-timeout-slider";
import { PinInput } from "./pin-input";
import type { LockSettings } from "@/lib/interfaces/local-auth";
export function SecuritySettings({ lockTimeoutMinutes, lockOnClose }: LockSettings) {
  const t = useTranslations("security");
  const router = useRouter();
  const [minutes, setMinutes] = useState(() => lockTimeoutOptions[nearestLockTimeoutIndex(lockTimeoutMinutes)]);
  const [onClose, setOnClose] = useState(lockOnClose);
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ changePin: false, text: "" });
  async function save(changePin: boolean) {
    const notify = (text: string) => setMessage({ changePin, text });
    if (changePin && pin !== confirmation) { notify(t("mismatch")); return; }
    setBusy(true); notify("");
    try {
      const response = await fetch(changePin ? "/api/pin" : "/api/security", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changePin ? { pin, currentPin } : { lockTimeoutMinutes: minutes, lockOnClose: onClose }),
      });
      if (response.status === 401 || response.status === 423) { window.location.assign(response.status === 401 ? "/login" : "/lock"); return; }
      const data = await response.json();
      if (!response.ok) { notify(typeof data.remaining === "number" ? t("remaining", { count: data.remaining }) : t("error")); return; }
      setCurrentPin(""); setPin(""); setConfirmation(""); notify(t("saved")); router.refresh();
    } catch { notify(t("error")); } finally { setBusy(false); }
  }
  return <div className="grid items-start gap-4 lg:grid-cols-2">
    <Card className="rounded-xl border-border bg-card">
      <CardHeader><CardTitle>{t("autoLockTitle")}</CardTitle><CardDescription>{t("autoLockDescription")}</CardDescription></CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={event => { event.preventDefault(); void save(false); }}>
          <LockTimeoutSlider value={minutes} onChange={setMinutes} disabled={busy} />
          <label className="flex items-center justify-between gap-4 border-t border-border pt-5 text-sm">
            <span><span className="block font-medium text-content-strong">{t("lockOnClose")}</span><span className="mt-1 block text-xs text-content-muted">{t("lockOnCloseDescription")}</span></span>
            <Switch checked={onClose} onCheckedChange={setOnClose} disabled={busy} />
          </label>
          <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={busy}>{t("save")}</Button><p role="status" className="text-sm">{message.changePin ? "" : message.text}</p></div>
        </form>
      </CardContent>
    </Card>
    <Card className="rounded-xl border-border bg-card">
      <CardHeader><CardTitle>{t("changePin")}</CardTitle><CardDescription>{t("pinDescription")}</CardDescription></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); void save(true); }}>
          <PinInput label={t("currentPin")} value={currentPin} onChange={setCurrentPin} disabled={busy} />
          <PinInput label={t("newPin")} value={pin} onChange={setPin} disabled={busy} />
          <PinInput label={t("confirmPin")} value={confirmation} onChange={setConfirmation} disabled={busy} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy || [pin, currentPin, confirmation].some(value => value.length !== 6)}>{t("changePin")}</Button>
            <p role="status" className="text-sm">{message.changePin ? message.text : ""}</p>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>;
}
