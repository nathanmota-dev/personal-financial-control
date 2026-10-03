"use client";
import Link from "next/link";
import { GoogleIcon } from "@/components/auth/google-icon";
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
  const buttonClassName = "flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60";
  return (
    <div className="mt-8">
      {demoMode ? <Link href={destination} className={buttonClassName}>Explorar demo</Link> : (
        <button type="button" onClick={login} disabled={busy} aria-busy={busy} className={buttonClassName}>
          <span className="rounded-full bg-white p-1"><GoogleIcon /></span>
          {busy ? "Entrando…" : "Continuar com Google"}
        </button>
      )}
      <p role="status" aria-live="polite" className={error ? "mt-4 text-sm text-danger" : "sr-only"}>{error}</p>
    </div>
  );
}
