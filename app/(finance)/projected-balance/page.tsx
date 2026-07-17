import { connection } from "next/server";
import { ZodError } from "zod";

import type { ProjectedBalanceFilterState } from "@/app/interfaces/projected-balance";
import { ProjectedBalanceView } from "@/components/finance/projected-balance-view";
import type { ProjectedBalanceRequest } from "@/lib/interfaces/projected-balance-server";
import { listAccounts } from "@/lib/server/accounts";
import { DomainError } from "@/lib/server/errors";
import {
  getProjectedBalance,
  parseProjectedBalanceSearchParams,
} from "@/lib/server/projected-balance";
import { getFinanceToday } from "@/lib/server/runtime";

type SearchParams = Record<string, string | string[] | undefined>;
type AccountRow = Awaited<ReturnType<typeof listAccounts>>[number];
type ProjectableAccountRow = AccountRow & {
  type: "checking" | "savings" | "cash";
};

export default async function ProjectedBalancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();

  const params = await searchParams;
  const urlSearchParams = toURLSearchParams(params);
  const defaultRequest = parseProjectedBalanceSearchParams(
    new URLSearchParams(),
    new Date(`${getFinanceToday()}T00:00:00.000Z`)
  );
  let request: ProjectedBalanceRequest = defaultRequest;
  let loadError: string | undefined;

  try {
    request = parseProjectedBalanceSearchParams(
      urlSearchParams,
      new Date(`${getFinanceToday()}T00:00:00.000Z`)
    );
  } catch (error) {
    loadError = getProjectionErrorMessage(error);
  }

  let accountRows: Awaited<ReturnType<typeof listAccounts>> = [];

  try {
    accountRows = await listAccounts();
  } catch {
    loadError = "Não foi possível carregar as contas para montar a projeção.";
  }

  const accounts = accountRows
    .filter(isProjectableAccount)
    .map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currentBalanceCents: account.currentBalanceCents,
    }));
  const creditAccounts = accountRows
    .filter((account) => account.type === "credit")
    .map((account) => ({
      id: account.id,
      name: account.name,
      creditDueDay: account.creditDueDay,
    }));
  let projection: Awaited<ReturnType<typeof getProjectedBalance>> | null = null;

  if (!loadError && accounts.length) {
    try {
      projection = await getProjectedBalance(request);
    } catch (error) {
      loadError = getProjectionErrorMessage(error);
    }
  }

  return (
    <ProjectedBalanceView
      projection={projection}
      accounts={accounts}
      creditAccounts={creditAccounts}
      filters={buildFilterState(request, projection)}
      loadError={loadError}
    />
  );
}

function isProjectableAccount(account: AccountRow): account is ProjectableAccountRow {
  return account.type === "checking" || account.type === "savings" || account.type === "cash";
}

function toURLSearchParams(params: SearchParams) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
      continue;
    }

    if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }

  return searchParams;
}

function buildFilterState(
  request: ProjectedBalanceRequest,
  projection: Awaited<ReturnType<typeof getProjectedBalance>> | null
): ProjectedBalanceFilterState {
  return {
    period: request.period,
    startDate: request.startDate,
    endDate: request.endDate ?? projection?.summary.endDate ?? request.startDate,
    accountId: request.accountIds[0],
    minimumReserveCents: request.minimumReserveCents,
    includeCreditCard: request.accountIds.length ? false : request.includeCreditCard,
    includeInvestments: request.includeInvestments,
    includeTransfers: request.includeTransfers,
  };
}

function getProjectionErrorMessage(error: unknown) {
  if (error instanceof DomainError || error instanceof ZodError) {
    return "Não foi possível calcular a projeção com os filtros atuais. Ajuste o período, a conta ou a reserva mínima e tente novamente.";
  }

  return "Não foi possível carregar o saldo projetado agora.";
}
