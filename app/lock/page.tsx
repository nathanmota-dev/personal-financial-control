import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AppBrand } from "@/components/finance/app-brand";
import { LockForm } from "@/components/auth/lock-form";
import { LockShowcase } from "@/components/auth/lock-showcase";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import { requirePageSession } from "@/lib/auth/server";
import { safeDestination } from "@/lib/auth/config";
import type { LoginPageProps } from "@/lib/interfaces/auth";
export default async function LockPage({ searchParams }: LoginPageProps) {
  const session = await requirePageSession(false);
  if (!("user" in session)) redirect("/dashboard");
  const [params, t] = await Promise.all([searchParams, getTranslations("security")]);
  const user = { name: session.name, email: session.email, picture: session.picture };
  return <main className="flex min-h-svh items-center justify-center bg-surface p-4 text-content-strong sm:p-8 lg:p-12">
    <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-border bg-surface shadow-elevation lg:min-h-[680px] lg:grid-cols-2">
      <section className="flex min-w-0 flex-col px-5 py-6 sm:px-12 sm:py-9 lg:px-14">
        <header className="flex items-center justify-between"><AppBrand /><ThemeToggle /></header>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10 lg:py-12">
          <LockForm setup={!session.user.pinHash || session.user.pinResetRequested} destination={safeDestination(params.next)} attempts={session.user.pinFailedAttempts} user={user} />
        </div>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-content-muted"><LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />{t("footer")}</p>
      </section>
      <LockShowcase />
    </div>
  </main>;
}
