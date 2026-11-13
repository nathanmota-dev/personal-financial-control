"use client";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LockUserCardProps } from "@/lib/interfaces/local-auth";

/** Shows which Google account owns the locked session. */
export function LockUserCard({ user }: LockUserCardProps) {
  const t = useTranslations("security");
  const name = user.name || user.email;
  return <div className="flex min-w-0 items-center gap-3">
    <Avatar className="size-11 shrink-0">
      {user.picture && <AvatarImage src={user.picture} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
    </Avatar>
    <div className="min-w-0">
      <p className="text-xs text-content">{t("signedInAs")}</p>
      <p data-user-content className="mt-0.5 truncate text-sm font-semibold text-content-strong" title={user.email}>{name}</p>
    </div>
  </div>;
}
