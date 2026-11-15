"use client";

import { useRef, useState } from "react";
import { createAccountAction } from "@/app/actions/finance";
import type { OnboardingAccountCreateInput, OnboardingAccountSubmitOptions } from "@/lib/interfaces/onboarding";

/** Creates one account at a time and reports the busy state to the onboarding flow. */
export function useOnboardingAccountSubmit({ onSaved, onBusyChange, disabled }: OnboardingAccountSubmitOptions) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);

  async function create(input: OnboardingAccountCreateInput) {
    if (lock.current || disabled) return false;
    if (!input.name.trim()) { setError("Informe um nome."); return false; }
    lock.current = true;
    setSaving(true);
    onBusyChange(true);
    setError("");
    try {
      onSaved(await createAccountAction(input));
      return true;
    } catch {
      setError("Não foi possível salvar. Confira os dados e tente novamente.");
      return false;
    } finally {
      lock.current = false;
      setSaving(false);
      onBusyChange(false);
    }
  }

  return { error, saving, create };
}
