import { SettingsView } from "@/components/finance/settings-view";
import { requirePageSession } from "@/lib/auth/server";
import { isDemoMode } from "@/lib/demo/mode";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import { isPluggyConfigured } from "@/lib/server/pluggy/config";

export default async function SettingsPage() {
  const session = await requirePageSession();
  let data:
    | {
        accounts: Awaited<ReturnType<typeof listAccounts>>;
        categories: Awaited<ReturnType<typeof listCategories>>;
      }
    | undefined;

  try {
    const [accounts, categories] = await Promise.all([
      listAccounts({ includeArchived: true }),
      listCategories({ includeArchived: true }),
    ]);
    data = { accounts, categories };
  } catch {}

  const security = "user" in session
    ? { lockTimeoutMinutes: session.user.lockTimeoutMinutes, lockOnClose: session.user.lockOnClose, hasMcpToken: Boolean(session.user.mcpTokenHash) }
    : undefined;

  const openFinance = security && !isDemoMode() ? { configured: isPluggyConfigured() } : undefined;

  return <SettingsView accounts={data?.accounts ?? []} categories={data?.categories ?? []} security={security} openFinance={openFinance} />;
}
