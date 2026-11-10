import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { AppBrand } from "@/components/finance/app-brand";
import { LoginArt } from "@/components/auth/login-art";
import { LockForm } from "@/components/auth/lock-form";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import { requirePageSession } from "@/lib/auth/server";
import { safeDestination } from "@/lib/auth/config";
import type { LoginPageProps } from "@/lib/interfaces/auth";
export default async function LockPage({ searchParams }: LoginPageProps) {
  const session = await requirePageSession(false);
  if (!("user" in session)) redirect("/dashboard");
  const params = await searchParams;
  return <main className="flex min-h-svh items-center justify-center bg-surface p-4 sm:p-8 lg:p-12">
    <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-border bg-surface-raised shadow-xl shadow-black/5 lg:min-h-[680px] lg:grid-cols-2">
      <section className="relative flex flex-col px-7 py-7 sm:px-12 sm:py-9 lg:px-16">
        <header className="flex items-center justify-between"><AppBrand /><ThemeToggle /></header>
        <div className="mx-auto flex w-full max-w-[340px] flex-1 flex-col justify-center py-12 lg:py-16">
          <LockForm setup={!session.user.pinHash || session.user.pinResetRequested} destination={safeDestination(params.next)} attempts={session.user.pinFailedAttempts} />
        </div>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-content-muted"><LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />Seu espaço pessoal. Protegido pelo seu PIN.</p>
      </section>
      <LoginArt />
    </div>
  </main>;
}
