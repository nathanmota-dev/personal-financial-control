import { requirePageSession } from "@/lib/auth/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { AppShell } from "@/components/finance/app-shell";
import { getServerEnv } from "@/lib/env";
import type { FinanceLayoutProps } from "@/lib/interfaces/app-shell";
import { getOnboarding } from "@/lib/server/onboarding";
import { OnboardingGate } from "@/components/finance/onboarding/gate";

export default async function FinanceLayout({ children }: FinanceLayoutProps) {
  await connection();
  const session = await requirePageSession();
  const user = {
    name: typeof session.name === "string" && session.name.trim() ? session.name : "Usuário",
    photoURL: typeof session.picture === "string" ? session.picture : null,
  };
  const { DEMO_MODE: demoMode } = getServerEnv();
  const onboarding = !demoMode && "uid" in session
    ? await getOnboarding(session.uid).catch(() => null)
    : null;

  return (
    <Suspense
      fallback={<div className="min-h-screen bg-surface text-content-strong">{children}</div>}
    >
      <AppShell demoMode={demoMode} user={user}>{children}</AppShell>
      {!demoMode && <OnboardingGate initialState={onboarding} name={user.name} />}
    </Suspense>
  );
}
