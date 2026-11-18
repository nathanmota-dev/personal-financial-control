import { CreditCardView } from "@/components/finance/credit-card-view";
import { requirePageSession } from "@/lib/auth/server";
import { isValidMonth } from "@/lib/finance-ui";
import { listCategories } from "@/lib/server/categories";
import { getCreditCardDefaultMonth, getCreditCardLimits, getCreditCardOverview, getCreditCardShowcase } from "@/lib/server/credit-card";
import { getFinanceDefaultMonth, getFinanceToday } from "@/lib/server/runtime";

export default async function CreditCardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageSession();
  const params = await searchParams;
  const monthParam = typeof params.month === "string" ? params.month : undefined;
  const cardParam = typeof params.card === "string" ? params.card : undefined;
  let month = isValidMonth(monthParam) ? monthParam : getFinanceDefaultMonth();

  let data:
    | {
        overview: Awaited<ReturnType<typeof getCreditCardOverview>>;
        categories: Awaited<ReturnType<typeof listCategories>>;
        cards: Awaited<ReturnType<typeof getCreditCardShowcase>>;
        limits: Awaited<ReturnType<typeof getCreditCardLimits>>;
        selectedCardId?: string;
      }
    | undefined;

  try {
    // Without a requested month, open the invoice still to be paid: past its due date it is the next one.
    const today = getFinanceToday();
    if (!isValidMonth(monthParam)) month = await getCreditCardDefaultMonth(today, cardParam);
    const cards = await getCreditCardShowcase(month);
    // An unknown or missing card falls back to the first one.
    const selectedCardId = cards.find((card) => card.id === cardParam)?.id ?? cards[0]?.id;
    const [overview, categories, limits] = await Promise.all([
      getCreditCardOverview(month, undefined, { accountId: selectedCardId }),
      listCategories(),
      // The limit is extra information: without it the page still opens.
      getCreditCardLimits(today).catch(() => ({})),
    ]);
    data = { overview, categories, cards, limits, selectedCardId };
  } catch {}

  return (
    <CreditCardView
      overview={data?.overview ?? { state: "no_account", month }}
      categories={data?.categories ?? []}
      loadError={!data}
      cards={data?.cards}
      selectedCardId={data?.selectedCardId}
      limits={data?.limits}
    />
  );
}
