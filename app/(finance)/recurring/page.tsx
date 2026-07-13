import { RecurringView } from "@/components/finance/recurring-view";
import { getDefaultMonth, isValidMonth } from "@/lib/finance-ui";
import type { RecurringViewProps } from "@/lib/interfaces/recurring";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import { getCategorySpendingReport } from "@/lib/server/dashboard";
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
  let data: Pick<
    RecurringViewProps,
    "accounts" | "categories" | "categorySpending" | "templates"
  > | undefined;

  try {
    const [accounts, categories, templates, categorySpending] = await Promise.all([
      listAccounts(),
      listCategories(),
      listRecurringTemplates(),
      getCategorySpendingReport(month),
    ]);
    data = { accounts, categories, templates, categorySpending };
  } catch {}

  return (
    <RecurringView
      accounts={data?.accounts ?? []}
      categories={data?.categories ?? []}
      categorySpending={data?.categorySpending ?? []}
      month={month}
      templates={data?.templates ?? []}
    />
  );
}
