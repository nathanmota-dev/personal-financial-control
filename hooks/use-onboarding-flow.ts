"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingAccount, OnboardingFlowProps, OnboardingUpdate } from "@/lib/interfaces/onboarding";
import { requestOnboarding } from "@/lib/onboarding/client";

export function useOnboardingFlow({ onStateChange }: OnboardingFlowProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<OnboardingAccount[]>([]);
  const [accountsError, setAccountsError] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const loadVersion = useRef(0);

  const loadAccounts = useCallback(() => {
    const version = ++loadVersion.current;
    return fetch("/api/accounts", { cache: "no-store" }).then(async response => {
      const body = await response.json();
      if (!response.ok || body.ok !== true || !Array.isArray(body.accounts)) throw new Error();
      if (version === loadVersion.current) { setAccounts(body.accounts); setAccountsError(false); }
    }).catch(() => { if (version === loadVersion.current) setAccountsError(true); })
      .finally(() => { if (version === loadVersion.current) setAccountsLoading(false); });
  }, []);

  useEffect(() => {
    const requests = loadVersion;
    void loadAccounts();
    return () => { requests.current++; };
  }, [loadAccounts]);

  function reloadAccounts() { setAccountsLoading(true); void loadAccounts(); }

  async function save(update: OnboardingUpdate) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await requestOnboarding(update);
      onStateChange(next);
      if (next.completedAt) { router.push("/dashboard"); router.refresh(); }
    } catch { setError("Não foi possível salvar seu progresso. Tente novamente."); }
    finally { lock.current = false; setBusy(false); }
  }

  function accountSaved(account: OnboardingAccount) {
    loadVersion.current++;
    setAccounts(previous => [...previous.filter(item => item.id !== account.id), account]);
  }
  function accountBusy(value: boolean) { lock.current = value; setBusy(value); }

  return { accounts, accountsError, accountsLoading, reloadAccounts, busy, error, save, accountSaved, accountBusy };
}
