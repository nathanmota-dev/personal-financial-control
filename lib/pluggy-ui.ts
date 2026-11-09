import type {
  PluggyAccountKind,
  PluggyAccountRow,
  PluggyApiErrorBody,
  PluggyAttentionReason,
  PluggyItemView,
  PluggyLinkView,
  PluggySyncRunStatus,
} from "@/lib/interfaces/pluggy";

export const pluggyTimeZone = "America/Sao_Paulo";

export const pluggyAccountKindLabels: Record<PluggyAccountKind, string> = { bank: "Conta bancária", credit: "Cartão de crédito" };
export const pluggyRunStatusLabels: Record<PluggySyncRunStatus, string> = {
  running: "Em andamento",
  success: "Concluída",
  partial: "Concluída com falhas",
  failed: "Falhou",
};

/** Run counts shown to the user, in display order. Zero counts are hidden. */
export const pluggyBankCountLabels: readonly (readonly [string, string])[] = [
  ["bankOrdinary", "lançamentos comuns"],
  ["bankOwnTransfer", "transferências próprias"],
  ["bankCardPayment", "pagamentos de fatura"],
  ["bankInvestmentContribution", "aportes"],
  ["bankInvestmentWithdrawal", "resgates"],
  ["bankUpdated", "atualizados"],
  ["bankCancelled", "cancelados"],
  ["bankIgnored", "ignorados"],
];

export const pluggyAttentionLabels: Record<PluggyAttentionReason, string> = {
  possible_own_transfer: "Pode ser transferência própria; foi importado como lançamento comum.",
  missing_other_own_account: "Transferência própria sem a outra conta. Escolha uma conta em Outras contas próprias.",
  missing_investment_category: "Crie uma categoria do grupo investimento para importar este movimento.",
};

export function formatPluggyDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR", { timeZone: pluggyTimeZone }) : "Não informado";
}

export function pluggyToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: pluggyTimeZone }).format(new Date());
}

/** Keeps saved links visible when Pluggy cannot list the accounts of a connection. */
export function buildPluggyAccountRows(item: PluggyItemView, links: PluggyLinkView[]): PluggyAccountRow[] {
  const itemLinks = links.filter((link) => link.itemId === item.id);
  const remote = item.remoteAccounts.map((account) => ({
    ...account,
    link: itemLinks.find((link) => link.externalAccountId === account.externalAccountId) ?? null,
  }));
  const known = new Set(item.remoteAccounts.map((account) => account.externalAccountId));
  const orphaned = itemLinks.filter((link) => !known.has(link.externalAccountId)).map((link) => ({
    externalAccountId: link.externalAccountId,
    name: link.remoteName,
    kind: link.kind,
    numberSuffix: null,
    link,
  }));
  return [...remote, ...orphaned];
}

export async function pluggyRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const hasBody = method !== "GET" && method !== "DELETE";
  const response = await fetch(path, {
    method,
    cache: "no-store",
    ...(hasBody ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) } : {}),
  });
  if (response.status === 401 || response.status === 423) {
    window.location.assign(response.status === 401 ? "/login" : "/lock");
    throw new Error("Sua sessão precisa ser renovada.");
  }
  const data = await response.json().catch(() => null) as (T & PluggyApiErrorBody) | null;
  if (!response.ok || !data) {
    const error = data?.error;
    throw new Error((typeof error === "string" ? error : error?.message) ?? "Não foi possível concluir a operação.");
  }
  return data;
}
