import { isDemoMode } from "@/lib/demo/mode";
import { LogoutButton } from "@/components/auth/logout-button";
import { requirePageSession } from "@/lib/auth/server";
import { SettingsView } from "@/components/finance/settings-view";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";

export default async function SettingsPage() {
  await requirePageSession();
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

  return <>{!isDemoMode() && <LogoutButton allDevices />}<SettingsView accounts={data?.accounts ?? []} categories={data?.categories ?? []} /></>;
}
