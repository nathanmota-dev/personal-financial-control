import { CreditCardView } from "@/components/finance/credit-card-view";
import { getDefaultMonth, isValidMonth } from "@/lib/finance-ui";
import { listCategories } from "@/lib/server/categories";
import { getCreditCardOverview } from "@/lib/server/credit-card";

export default async function CreditCardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const monthParam = typeof params.month === "string" ? params.month : undefined;
  const month = isValidMonth(monthParam) ? monthParam : getDefaultMonth();

  let data:
    | {
        overview: Awaited<ReturnType<typeof getCreditCardOverview>>;
        categories: Awaited<ReturnType<typeof listCategories>>;
      }
    | undefined;

  try {
    const [overview, categories] = await Promise.all([
      getCreditCardOverview(month),
      listCategories(),
    ]);
    data = { overview, categories };
  } catch {}

  return (
    <CreditCardView
      overview={data?.overview ?? { state: "no_account", month }}
      categories={data?.categories ?? []}
    />
  );
}
