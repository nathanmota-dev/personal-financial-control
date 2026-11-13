import { SettingsView } from "@/components/finance/settings-view";
import { requirePageSession } from "@/lib/auth/server";
import { isDemoMode } from "@/lib/demo/mode";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import { getInvestmentProjection } from "@/lib/server/investments";
import { isPluggyConfigured } from "@/lib/server/pluggy/config";

const SETTINGS_TABS = new Set(["accounts", "cards", "investments", "categories", "open-finance", "security", "mcp"]);

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> } = {}) {
  const session = await requirePageSession();
  const { tab } = (await searchParams) ?? {};
  let data:
    | {
        accounts: Awaited<ReturnType<typeof listAccounts>>;
        categories: Awaited<ReturnType<typeof listCategories>>;
        reserveProjection: Awaited<ReturnType<typeof getInvestmentProjection>>;
      }
    | undefined;

  try {
    const [accounts, categories, reserveProjection] = await Promise.all([
      listAccounts({ includeArchived: true }),
      listCategories({ includeArchived: true }),
      getInvestmentProjection(),
    ]);
    data = { accounts, categories, reserveProjection };
  } catch {}

  const security = "user" in session
    ? { lockTimeoutMinutes: session.user.lockTimeoutMinutes, lockOnClose: session.user.lockOnClose, hasMcpToken: Boolean(session.user.mcpTokenHash) }
    : undefined;

  const openFinance = security && !isDemoMode() ? { configured: isPluggyConfigured() } : undefined;

  const initialTab = typeof tab === "string" && SETTINGS_TABS.has(tab) ? tab : "accounts";

  return <SettingsView accounts={data?.accounts ?? []} categories={data?.categories ?? []} reserveProjection={data?.reserveProjection ?? null} initialTab={initialTab} security={security} openFinance={openFinance} />;
}
