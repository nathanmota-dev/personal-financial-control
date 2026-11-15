"use client";

import { useTranslations } from "next-intl";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ACCOUNT_ILLUSTRATIONS } from "@/lib/account-illustrations";
import type { AccountPreviewCardProps } from "@/lib/interfaces/auth";
import { getUserInitials } from "@/lib/user-initials";

export function AccountPreviewCard({ firstName, lastName, email }: AccountPreviewCardProps) {
  const t = useTranslations("accountPreferences");
  const fullName = [firstName, lastName].map((part) => part.trim()).filter(Boolean).join(" ");
  return (
    <section aria-label={t("previewTitle")} className="relative flex min-w-0 flex-col rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src={ACCOUNT_ILLUSTRATIONS.preview} />
      <h2 className="text-lg font-semibold leading-[25px]">{t("previewTitle")}</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">{t("previewDescription")}</p>
      <div className="mt-6 flex min-w-0 items-center gap-3 rounded-[14px] border border-border bg-surface p-3">
        <Avatar size="lg" className="size-10 shrink-0">
          <AvatarFallback className="bg-brand/15 text-sm font-semibold text-brand">{getUserInitials(fullName || "U")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p data-user-content className="truncate text-sm font-semibold text-content-strong">{firstName.trim() || "—"}</p>
          <p data-user-content className="mt-0.5 truncate text-xs text-content-subtle">{email ?? "—"}</p>
        </div>
      </div>
      <p className="mt-6 text-[10px] font-bold tracking-wider text-content uppercase">{t("fieldsLabel")}</p>
      <dl className="mt-2 divide-y divide-border">
        <div className="flex items-center justify-between gap-4 py-3 text-[13px]">
          <dt className="text-content">{t("previewName")}</dt>
          <dd data-user-content className="min-w-0 truncate font-semibold text-content-strong">{fullName || "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-3 text-[13px]">
          <dt className="text-content">{t("previewEmail")}</dt>
          <dd data-user-content className="min-w-0 truncate font-semibold text-content-strong">{email ?? "—"}</dd>
        </div>
      </dl>
      <p className="mt-auto pt-4 text-xs leading-5 text-content-muted">{t("previewNote")}</p>
    </section>
  );
}
