import { SessionActivity } from "@/components/auth/session-activity";
import { requirePageSession } from "@/lib/auth/server";
import { connection } from "next/server";
import { Suspense } from "react";

import { FinancialPrivacyProvider } from "@/components/finance/privacy/privacy-provider";
import { AppShell } from "@/components/finance/app-shell";
import { FinanceShellSkeleton } from "@/components/finance/loading/shell-skeleton";
import { getServerEnv } from "@/lib/env";
import type { FinanceLayoutProps } from "@/lib/interfaces/app-shell";
import { getOnboarding } from "@/lib/server/onboarding";
import { OnboardingGate } from "@/components/finance/onboarding/gate";
import { OnboardingDemoPreview } from "@/components/finance/onboarding/demo-preview";
import { DatabaseSyncProvider } from "@/components/finance/database-sync-provider";
import { getDatabaseSyncStatus } from "@/lib/db/replica";

export default async function FinanceLayout({ children }: FinanceLayoutProps) {
  await connection();
  const session = await requirePageSession();
  const user = {
    name: typeof session.name === "string" && session.name.trim() ? session.name : "Usuário",
    email: "email" in session && typeof session.email === "string" ? session.email : null,
    photoURL: typeof session.picture === "string" ? session.picture : null,
  };
  const { DEMO_MODE: demoMode } = getServerEnv();
  const onboarding = !demoMode && "uid" in session
    ? await getOnboarding(session.uid).catch(() => null)
    : null;

  return (
    <Suspense
      fallback={<FinanceShellSkeleton />}
    >
      <FinancialPrivacyProvider key={String(demoMode)} demoMode={demoMode}>
        {!demoMode && "user" in session && <SessionActivity timeoutMinutes={session.user.lockTimeoutMinutes} />}
        <DatabaseSyncProvider initialStatus={await getDatabaseSyncStatus()}>
          <AppShell demoMode={demoMode} user={user}>{children}</AppShell>
        </DatabaseSyncProvider>
        {demoMode ? <OnboardingDemoPreview name={user.name} /> : <OnboardingGate initialState={onboarding} name={user.name} />}
      </FinancialPrivacyProvider>
    </Suspense>
  );
}
