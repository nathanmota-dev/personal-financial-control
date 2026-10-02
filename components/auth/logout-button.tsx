"use client";
import { useState } from "react";
import type { LogoutButtonProps } from "@/lib/interfaces/auth";
export function LogoutButton({ allDevices = false }: LogoutButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch(allDevices ? "/api/session/revoke" : "/api/session", { method: allDevices ? "POST" : "DELETE", headers: { "Content-Type": "application/json" }, ...(allDevices ? { body: "{}" } : {}) });
      if (!response.ok) throw new Error("Não foi possível sair. Tente novamente.");
      // Discard the authenticated router cache and client state on logout.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Falha de conexão."); setBusy(false); }
  }
  return <div className="p-3"><button disabled={busy} onClick={logout} className="rounded-xl px-3 py-2 text-sm text-content hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50">{busy ? "Saindo…" : allDevices ? "Sair de todos os dispositivos" : "Sair"}</button><p role="status" className="text-xs text-danger">{error}</p></div>;
}
