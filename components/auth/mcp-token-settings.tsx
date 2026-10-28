"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { McpTokenSettingsProps } from "@/lib/interfaces/local-auth";
export function McpTokenSettings({ hasMcpToken }: McpTokenSettingsProps) {
  const t = useTranslations("security");
  const [exists, setExists] = useState(hasMcpToken);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function change(revoke: boolean) {
    setBusy(true); setToken(""); setMessage("");
    try {
      const response = await fetch("/api/security/token", { method: revoke ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (response.status === 401 || response.status === 423) { window.location.assign(response.status === 401 ? "/login" : "/lock"); return; }
      if (!response.ok) throw new Error();
      const data = await response.json();
      setExists(!revoke); setToken(data.token ?? ""); setMessage(t(revoke ? "revoked" : "tokenOnce"));
    } catch { setMessage(t("error")); } finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(token); setMessage(t("copied")); }
    catch { setMessage(t("error")); }
  }
  return <div className="space-y-4 border-t border-border pt-6">
    <h3 className="font-medium">{t("mcpTitle")}</h3><p className="text-sm text-content-muted">{t("mcpDescription")}</p>
    <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={busy} onClick={() => change(false)}>{t(exists ? "regenerate" : "generate")}</Button>
      {exists && <Button variant="destructive" disabled={busy} onClick={() => change(true)}>{t("revoke")}</Button>}
    </div>
    {token && <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted p-3"><code className="break-all text-sm" data-user-content>{token}</code><Button variant="outline" onClick={copy}>{t("copy")}</Button><Button variant="ghost" onClick={() => setToken("")}>{t("hide")}</Button></div>}
    <p role="status" className="text-sm">{message}</p>
  </div>;
}
