"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { OnboardingGateProps, OnboardingState } from "@/lib/interfaces/onboarding";
import { requestOnboarding } from "@/lib/onboarding/client";

const OnboardingFlow = dynamic(() => import("./flow"), { ssr: false });

export function OnboardingGate({ initialState, name }: OnboardingGateProps) {
  const [state, setState] = useState(initialState);
  const [dismissed, setDismissed] = useState(false);
  const [failed, setFailed] = useState(initialState === null);
  const [loading, setLoading] = useState(false);
  const version = useRef(0);
  const settled = useRef(Boolean(initialState?.completedAt));

  const updateState = useCallback((next: OnboardingState) => {
    version.current++;
    settled.current ||= Boolean(next.completedAt);
    setState(previous => previous?.completedAt ? previous : next);
    setFailed(false);
  }, []);

  const reload = useCallback(async () => {
    const current = ++version.current;
    setLoading(true);
    try {
      const next = await requestOnboarding();
      if (current === version.current) updateState(next);
    } catch {
      if (current === version.current && !settled.current) setFailed(true);
    } finally { setLoading(false); }
  }, [updateState]);

  useEffect(() => {
    const requests = version;
    const onFocus = () => { if (!settled.current) void reload(); };
    window.addEventListener("focus", onFocus);
    return () => { requests.current++; window.removeEventListener("focus", onFocus); };
  }, [reload]);

  if (state?.completedAt) return null;
  return <>
    {failed && <div role="alert" className="fixed right-4 bottom-4 z-40 max-w-[calc(100%-2rem)] rounded-[14px] border border-border bg-card p-4 shadow-elevation">
      <p className="mb-3 text-[13px] text-content-strong">Não foi possível consultar sua configuração inicial.</p>
      <Button variant="secondary" className="h-10 rounded-[10px] text-[13px] font-medium" disabled={loading} onClick={() => void reload()}>Tentar novamente</Button>
    </div>}
    {state && !dismissed && <OnboardingFlow state={state} name={name} onStateChange={updateState} onDismiss={() => setDismissed(true)} />}
  </>;
}
