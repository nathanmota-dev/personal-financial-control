import { connection } from "next/server";

import { InvestmentsView } from "@/components/finance/investments-view";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import {
  getInvestmentContributionHistory,
  getInvestmentProjection,
} from "@/lib/server/investments";

export default async function InvestmentsPage() {
  await connection();

  const [projection, contributionHistory, accounts, categories] = await Promise.all([
    getInvestmentProjection(),
    getInvestmentContributionHistory(),
    listAccounts(),
    listCategories(),
  ]);

  const sourceAccounts = accounts
    .filter(
      (account) =>
        account.type === "checking" || account.type === "savings" || account.type === "cash"
    )
    .map((account) => ({ id: account.id, name: account.name }));
  const investmentCategories = categories
    .filter((category) => category.group === "investment")
    .map((category) => ({ id: category.id, name: category.name }));

  return (
    <InvestmentsView
      key={`${projection?.updatedAt ?? "empty"}-${projection?.currentBalanceCents ?? 0}-${projection?.referenceDate ?? "none"}`}
      projection={projection}
      contributionHistory={contributionHistory}
      sourceAccounts={sourceAccounts}
      investmentCategories={investmentCategories}
    />
  );
}
