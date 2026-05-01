import { SettingsView } from "@/components/finance/settings-view";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";

export default async function SettingsPage() {
  let data:
    | {
        accounts: Awaited<ReturnType<typeof listAccounts>>;
        categories: Awaited<ReturnType<typeof listCategories>>;
      }
    | undefined;
  let errorMessage: string | undefined;

  try {
    const [accounts, categories] = await Promise.all([
      listAccounts({ includeArchived: true }),
      listCategories({ includeArchived: true }),
    ]);
    data = { accounts, categories };
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Falha desconhecida ao ler os dados.";
  }

  return (
    <SettingsView
      accounts={data?.accounts ?? []}
      categories={data?.categories ?? []}
      warning={errorMessage}
    />
  );
}
