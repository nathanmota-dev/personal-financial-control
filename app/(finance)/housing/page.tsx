import { HousingView } from "@/components/finance/housing-view";
import { requirePageSession } from "@/lib/auth/server";
import { HOUSING_CATEGORY_IDS } from "@/lib/dashboard-housing";
import { isValidMonth } from "@/lib/finance-ui";
import type { HousingViewData } from "@/lib/interfaces/housing";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import { getHousingViewData } from "@/lib/server/housing";
import { getFinanceDefaultMonth } from "@/lib/server/runtime";

export default async function HousingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageSession();
  const params = await searchParams;
  const month = isValidMonth(typeof params.month === "string" ? params.month : undefined)
    ? (params.month as string)
    : getFinanceDefaultMonth();
  let data: (HousingViewData & { accounts: Awaited<ReturnType<typeof listAccounts>>; categories: Awaited<ReturnType<typeof listCategories>> }) | undefined;

  try {
    const [view, accounts, categories] = await Promise.all([getHousingViewData(month), listAccounts(), listCategories()]);
    data = {
      ...view,
      accounts: accounts.filter((account) => account.type !== "credit"),
      // Moradia first, so it is the default choice in the dialogs.
      categories: HOUSING_CATEGORY_IDS.flatMap((id) => categories.filter((category) => category.id === id)),
    };
  } catch {}

  return (
    <HousingView
      month={month}
      housing={data?.housing ?? { totalCents: 0, incomeCents: 0, sharePercent: null, items: [] }}
      entries={data?.entries ?? []}
      templates={data?.templates ?? []}
      accounts={data?.accounts ?? []}
      categories={data?.categories ?? []}
    />
  );
}
