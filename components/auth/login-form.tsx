"use client";
import { useState } from "react";
import type { LoginFormProps } from "@/lib/interfaces/auth";
export function LoginForm({ destination }: LoginFormProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login() {
    setBusy(true); setError("");
    try { const { googleLogin } = await import("@/lib/auth/client"); await googleLogin(); window.location.assign(destination); }
    catch (failure) {
      const code = (failure as { code?: string }).code;
      const messages: Record<string, string> = { "auth/configuration-not-found": "O Firebase Authentication ainda não foi configurado. Ative Authentication e o provedor Google no console do Firebase.", "auth/operation-not-allowed": "O login Google não está habilitado no Firebase Authentication.", "auth/unauthorized-domain": "Este domínio não está autorizado no Firebase Authentication. Cadastre-o em Settings > Authorized domains.", "auth/invalid-api-key": "A configuração do Firebase é inválida. Confira a API key do app Web e reinicie o app.", "auth/popup-closed-by-user": "Login cancelado. Você pode tentar novamente.", "auth/cancelled-popup-request": "Login cancelado. Tente novamente.", "auth/popup-blocked": "Permita popups neste navegador e tente novamente.", "auth/network-request-failed": "Falha de conexão. Verifique sua internet e tente novamente." };
      setError(messages[code || ""] || (failure instanceof Error ? failure.message : "Não foi possível entrar.")); setBusy(false);
    }
  }
  return <div className="mt-10"><button onClick={login} disabled={busy} className="flex cursor-pointer disabled:cursor-not-allowed w-full items-center justify-center gap-3 rounded-2xl border border-brand/40 bg-brand px-6 py-4 font-semibold text-surface transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand disabled:opacity-60"><span aria-hidden="true" className="text-xl">G</span>{busy ? "Entrando…" : "Continuar com Google"}</button><p role="status" aria-live="polite" className="mt-4 min-h-12 text-sm text-content">{error}</p></div>;
}
