"use client";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { LockAttemptsProps } from "@/lib/interfaces/local-auth";

/** Remaining PIN attempts as a segmented meter, red once only two are left. */
export function LockAttempts({ remaining, total }: LockAttemptsProps) {
  const t = useTranslations("security");
  const low = remaining <= 2;
  const Icon = low ? TriangleAlert : ShieldCheck;
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-3 text-xs">
      <p className={cn("flex items-center gap-1.5 font-semibold", low ? "text-destructive" : "text-content-strong")}><Icon className="size-3.5 shrink-0" aria-hidden="true" />{t("remaining", { count: remaining })}</p>
      <span aria-hidden="true" className="text-[11px] text-content-subtle">{remaining}/{total}</span>
    </div>
    <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
      {Array.from({ length: total }, (_, index) => <span key={index} className={cn("flex-1", index < remaining ? (low ? "bg-destructive" : "bg-success") : "bg-[var(--chart-rail)]")} />)}
    </div>
  </div>;
}
