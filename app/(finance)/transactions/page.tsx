import { TransactionsView } from "@/components/finance/transactions-view";
import { getDefaultMonth, isValidMonth } from "@/lib/finance-ui";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import { listTransactions } from "@/lib/server/transactions";
import { listTransfers } from "@/lib/server/transfers";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const month = isValidMonth(typeof params.month === "string" ? params.month : undefined)
    ? (params.month as string)
    : getDefaultMonth();
  const accountId = typeof params.accountId === "string" ? params.accountId : undefined;
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;
  const section = typeof params.section === "string" ? params.section : "transactions";
  let data:
    | {
        accounts: Awaited<ReturnType<typeof listAccounts>>;
        categories: Awaited<ReturnType<typeof listCategories>>;
        transactions: Awaited<ReturnType<typeof listTransactions>>;
        transfers: Awaited<ReturnType<typeof listTransfers>>;
      }
    | undefined;

  try {
    const [accounts, categories, transactions, transfers] = await Promise.all([
      listAccounts(),
      listCategories(),
      listTransactions({
        competenceMonth: month,
        accountId,
        categoryId,
        status:
          status === "pending" || status === "posted" || status === "cancelled"
            ? status
            : undefined,
      }),
      listTransfers({
        competenceMonth: month,
        accountId,
      }),
    ]);
    data = { accounts, categories, transactions, transfers };
  } catch {}

  const filteredTransactions =
    type === "income" || type === "expense" || type === "investment_contribution"
      ? (data?.transactions ?? []).filter((item) => item.type === type)
      : (data?.transactions ?? []);

  return (
    <TransactionsView
      accounts={data?.accounts ?? []}
      categories={data?.categories ?? []}
      transactions={filteredTransactions}
      transfers={data?.transfers ?? []}
      filters={{
        month,
        accountId,
        categoryId,
        status,
        type,
        section,
      }}
    />
  );
}
