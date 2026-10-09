"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { profileSchema } from "@/lib/auth/profile-schema";
import type { ProfileInput } from "@/lib/interfaces/profile";

export function useAccountProfile(name: string) {
  const [firstName, ...lastName] = name.trim().split(/\s+/);
  const [values, setValues] = useState<ProfileInput>({ firstName, lastName: lastName.join(" ") });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const t = useTranslations("accountPreferences");

  function updateField(field: keyof ProfileInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setError("");
  }

  async function save() {
    if (busy) return;
    setSaved(false);
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) { setError(t("invalidName")); return; }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) throw new Error("Profile update failed");
      setValues(parsed.data);
      setSaved(true);
      router.refresh();
    } catch {
      setError(t("saveError"));
    } finally {
      setBusy(false);
    }
  }

  return { values, busy, error, saved, updateField, save };
}
