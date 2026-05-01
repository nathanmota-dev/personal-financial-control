import { RecurringView } from "@/components/finance/recurring-view";
import { getDefaultMonth, isValidMonth } from "@/lib/finance-ui";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import { listRecurringTemplates } from "@/lib/server/recurring";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const month = isValidMonth(typeof params.month === "string" ? params.month : undefined)
    ? (params.month as string)
    : getDefaultMonth();
  let data:
    | {
        accounts: Awaited<ReturnType<typeof listAccounts>>;
        categories: Awaited<ReturnType<typeof listCategories>>;
        templates: Awaited<ReturnType<typeof listRecurringTemplates>>;
      }
    | undefined;
  let errorMessage: string | undefined;

  try {
    const [accounts, categories, templates] = await Promise.all([
      listAccounts(),
      listCategories(),
      listRecurringTemplates(),
    ]);
    data = { accounts, categories, templates };
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Falha desconhecida ao ler os dados.";
  }

  return (
    <RecurringView
      accounts={data?.accounts ?? []}
      categories={data?.categories ?? []}
      month={month}
      templates={data?.templates ?? []}
      warning={errorMessage}
    />
  );
}
