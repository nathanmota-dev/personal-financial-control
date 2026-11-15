"use client";

import { useAccountProfile } from "@/hooks/use-account-profile";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AccountPreviewCard } from "@/components/auth/account-preview-card";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { PageHeader } from "@/components/finance/page-header";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCOUNT_ILLUSTRATIONS } from "@/lib/account-illustrations";
import type { AccountProfileField } from "@/lib/interfaces/profile";
import type { AccountViewProps } from "@/lib/interfaces/auth";

const buttonClassName = "h-10 gap-[10px] rounded-[10px] text-[13px] font-medium";

export function AccountView({ user, demoMode = false }: AccountViewProps) {
  const router = useRouter();
  const t = useTranslations("accountPreferences");
  const profile = useAccountProfile(user.name);
  const fields: AccountProfileField[] = [
    { id: "firstName", label: t("firstName"), maxLength: 80 },
    { id: "lastName", label: t("lastName"), maxLength: 120 },
  ];

  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader
        className="[&>div:last-child]:-order-1"
        title={t("myAccount")}
        description={t("accountDescription")}
        actions={<BackButton href="/dashboard" label={t("back")} onClick={(event) => { if (window.history.length > 1) { event.preventDefault(); router.back(); } }} />}
      />
      <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
        <form onSubmit={(event) => { event.preventDefault(); if (!demoMode) void profile.save(); }} aria-label={t("myAccount")} className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
          <DashboardCardIllustration src={ACCOUNT_ILLUSTRATIONS.profile} className="top-4 right-6 size-[96px]" />
          <h2 className="text-sm font-semibold text-content-strong">{t("profileTitle")}</h2>
          <p className="mt-2 pr-28 text-xs text-content">{t("profileHint")}</p>
          <p className="mt-8 text-[10px] font-bold tracking-wider text-content uppercase">{t("fieldsLabel")}</p>
          <div className="mt-3 grid gap-5 @md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.id} className="min-w-0 space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input data-user-content id={field.id} value={profile.values[field.id]} onChange={(event) => profile.updateField(field.id, event.target.value)} maxLength={field.maxLength} required={field.id === "firstName"} readOnly={demoMode} disabled={profile.busy} />
              </div>
            ))}
            <div className="min-w-0 space-y-2 @md:col-span-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input data-user-content id="email" type="email" value={user.email ?? ""} readOnly aria-describedby="email-description" />
              <p id="email-description" className="text-xs text-content-subtle">{t("emailReadOnly")}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
            {demoMode ? <p className="text-xs text-content-subtle">{t("demoProfile")}</p> : (
              <Button type="submit" className={buttonClassName} disabled={profile.busy}><Save className="size-[17px]" />{profile.busy ? t("saving") : t("save")}</Button>
            )}
            {profile.error && <p role="alert" className="text-xs text-destructive">{profile.error}</p>}
            {profile.saved && <p role="status" className="text-xs text-success">{t("saved")}</p>}
          </div>
        </form>
        <AccountPreviewCard firstName={profile.values.firstName} lastName={profile.values.lastName} email={user.email} />
      </div>
    </div>
  );
}
