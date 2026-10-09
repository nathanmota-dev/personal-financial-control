"use client";

import { useAccountProfile } from "@/hooks/use-account-profile";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccountProfileField } from "@/lib/interfaces/profile";
import type { AccountViewProps } from "@/lib/interfaces/auth";

export function AccountView({ user, demoMode = false }: AccountViewProps) {
  const router = useRouter();
  const t = useTranslations("accountPreferences");
  const profile = useAccountProfile(user.name);
  const fields: AccountProfileField[] = [
    { id: "firstName", label: t("firstName"), maxLength: 80 },
    { id: "lastName", label: t("lastName"), maxLength: 120 },
  ];

  return (
    <div className="space-y-6">
      <Button variant="outline" className="cursor-pointer" onClick={() => window.history.length > 1 ? router.back() : router.replace("/dashboard")}>
          <ArrowLeft className="size-4" />{t("back")}
      </Button>
      <PageHeader title={t("myAccount")} description={t("accountDescription")} />
      <form onSubmit={(event) => { event.preventDefault(); if (!demoMode) void profile.save(); }} aria-label={t("myAccount")} className="max-w-2xl space-y-6 rounded-[20px] border border-border bg-card p-5 sm:p-6">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input data-user-content id={field.id} value={profile.values[field.id]} onChange={(event) => profile.updateField(field.id, event.target.value)} maxLength={field.maxLength} required={field.id === "firstName"} readOnly={demoMode} disabled={profile.busy} />
          </div>
        ))}
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input data-user-content id="email" type="email" value={user.email ?? ""} readOnly aria-describedby="email-description" />
          <p id="email-description" className="text-xs text-content-subtle">{t("emailReadOnly")}</p>
        </div>
        {demoMode ? <p className="text-sm text-content-subtle">{t("demoProfile")}</p> : (
          <Button type="submit" disabled={profile.busy}>{profile.busy ? t("saving") : t("save")}</Button>
        )}
        {profile.error && <p role="alert" className="text-sm text-danger">{profile.error}</p>}
        {profile.saved && <p role="status" className="text-sm text-content">{t("saved")}</p>}
      </form>
    </div>
  );
}
