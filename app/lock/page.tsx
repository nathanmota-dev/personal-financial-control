import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { LockForm } from "@/components/auth/lock-form";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import { requirePageSession } from "@/lib/auth/server";
import { safeDestination } from "@/lib/auth/config";
import type { LoginPageProps } from "@/lib/interfaces/auth";
export default async function LockPage({ searchParams }: LoginPageProps) {
  const session = await requirePageSession(false);
  if (!("user" in session)) redirect("/dashboard");
  const params = await searchParams;
  return <main className="flex min-h-svh items-center justify-center bg-surface p-4 sm:p-8">
    <section className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-surface-raised p-7 shadow-sm sm:p-10">
      <header className="flex items-center justify-between"><LockKeyhole className="size-6 text-primary" aria-hidden="true" /><ThemeToggle /></header>
      <LockForm setup={!session.user.pinHash || session.user.pinResetRequested} destination={safeDestination(params.next)} attempts={session.user.pinFailedAttempts} />
    </section>
  </main>;
}
