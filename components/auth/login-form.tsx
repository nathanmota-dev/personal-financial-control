"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { loginErrorMessage } from "@/lib/auth/login-errors";
import type { LoginFormProps } from "@/lib/interfaces/auth";
export function LoginForm({ destination, demoMode }: LoginFormProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const loginInProgress = useRef(false);
  async function login() {
    if (loginInProgress.current) return;
    loginInProgress.current = true;
    let navigating = false;
    setBusy(true); setError("");
    try {
      const { googleLogin } = await import("@/lib/auth/client");
      await googleLogin();
      window.location.assign(destination);
      navigating = true;
    }
    catch (failure) {
      setError(loginErrorMessage(failure, window.location.hostname));
    } finally {
      if (!navigating) {
        loginInProgress.current = false;
        setBusy(false);
      }
    }
  }
  if (demoMode) return <div className="mt-10"><Link href={destination} className="flex w-full items-center justify-center rounded-2xl border border-brand/40 bg-brand px-6 py-4 font-semibold text-surface transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">Explorar demo</Link></div>;
  return <div className="mt-10"><button onClick={login} disabled={busy} className="flex cursor-pointer disabled:cursor-not-allowed w-full items-center justify-center gap-3 rounded-2xl border border-brand/40 bg-brand px-6 py-4 font-semibold text-surface transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand disabled:opacity-60"><span aria-hidden="true" className="text-xl">G</span>{busy ? "Entrando…" : "Continuar com Google"}</button><p role="status" aria-live="polite" className="mt-4 min-h-12 text-sm text-content">{error}</p></div>;
}
