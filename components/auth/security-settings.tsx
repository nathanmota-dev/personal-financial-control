"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PinInput } from "./pin-input";
import { McpTokenSettings } from "./mcp-token-settings";
import type { SecuritySettingsProps } from "@/lib/interfaces/local-auth";
export function SecuritySettings({ lockTimeoutMinutes, lockOnClose, hasMcpToken }: SecuritySettingsProps) {
  const t = useTranslations("security");
  const router = useRouter();
  const [minutes, setMinutes] = useState(lockTimeoutMinutes);
  const [onClose, setOnClose] = useState(lockOnClose);
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(changePin: boolean) {
    if (changePin && pin !== confirmation) { setMessage(t("mismatch")); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch(changePin ? "/api/pin" : "/api/security", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changePin ? { pin, currentPin } : { lockTimeoutMinutes: minutes, lockOnClose: onClose }),
      });
      if (response.status === 401 || response.status === 423) { window.location.assign(response.status === 401 ? "/login" : "/lock"); return; }
      const data = await response.json();
      if (!response.ok) { setMessage(typeof data.remaining === "number" ? t("remaining", { count: data.remaining }) : t("error")); return; }
      setCurrentPin(""); setPin(""); setConfirmation(""); setMessage(t("saved")); router.refresh();
    } catch { setMessage(t("error")); } finally { setBusy(false); }
  }
  return <section className="space-y-6 rounded-xl border border-border bg-surface-raised p-6">
    <div><h2 className="text-lg font-semibold">{t("title")}</h2><p className="mt-1 text-sm text-content-muted">{t("description")}</p></div>
    <div className="grid gap-8 lg:grid-cols-2">
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); void save(false); }}>
        <label className="block space-y-2 text-sm font-medium"><span>{t("timeout")}</span><Input type="number" min={1} max={120} required value={minutes} onChange={event => setMinutes(Number(event.target.value))} disabled={busy} /></label>
        <label className="flex items-center justify-between gap-4 text-sm"><span>{t("lockOnClose")}</span><Switch checked={onClose} onCheckedChange={setOnClose} disabled={busy} /></label>
        <Button type="submit" disabled={busy}>{t("save")}</Button>
      </form>
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); void save(true); }}>
        <h3 className="font-medium">{t("changePin")}</h3>
        <PinInput label={t("currentPin")} value={currentPin} onChange={setCurrentPin} disabled={busy} />
        <PinInput label={t("newPin")} value={pin} onChange={setPin} disabled={busy} />
        <PinInput label={t("confirmPin")} value={confirmation} onChange={setConfirmation} disabled={busy} />
        <Button type="submit" disabled={busy || [pin, currentPin, confirmation].some(value => value.length !== 6)}>{t("changePin")}</Button>
      </form>
    </div>
    <p role="status" className="text-sm">{message}</p>
    <McpTokenSettings hasMcpToken={hasMcpToken} />
  </section>;
}
