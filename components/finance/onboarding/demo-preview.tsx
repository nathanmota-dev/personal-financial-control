"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { OnboardingDemoPreviewProps, OnboardingState, OnboardingUpdate } from "@/lib/interfaces/onboarding";

const OnboardingFlow = dynamic(() => import("./flow"), { ssr: false });
const initialState: OnboardingState = { step: 1, completedAt: null };

/** Demo-only: `?onboarding=preview` opens the setup flow with progress kept in memory. */
export function OnboardingDemoPreview({ name }: OnboardingDemoPreviewProps) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState(initialState);
  if (params.get("onboarding") !== "preview") return null;

  async function persist(update: OnboardingUpdate) {
    return "completed" in update ? { ...state, completedAt: new Date().toISOString() } : { step: update.step, completedAt: null };
  }
  function close() {
    setState(initialState);
    router.replace(pathname);
  }

  return <OnboardingFlow state={state} name={name} persist={persist} onDismiss={close} onStateChange={next => setState(next.completedAt ? initialState : next)} />;
}
