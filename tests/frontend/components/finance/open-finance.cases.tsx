import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OpenFinanceSettings } from "@/components/finance/open-finance/open-finance-settings";
import { FinancialPrivacyContext } from "@/components/finance/privacy/privacy-context";
import { HIDDEN_FINANCIAL_VALUE } from "@/lib/financial-privacy";
import type { AccountRow, CategoryRow } from "@/lib/interfaces/components/settings-view";
import type { PluggyIdentityView, PluggyItemView, PluggyLinkView, PluggySyncRunView } from "@/lib/interfaces/pluggy";
import type { PluggyPendingCategoryGroup } from "@/lib/interfaces/pluggy-category-rules";
import { renderUI } from "@/tests/frontend/helpers";

const accounts: AccountRow[] = [
  { id: "local-1", name: "Conta local", type: "checking", initialBalanceCents: 0, currentBalanceCents: 0, creditClosingDay: null, creditDueDay: 10, isArchived: false },
  { id: "local-2", name: "Cartão local", type: "credit", initialBalanceCents: 0, currentBalanceCents: 0, creditClosingDay: 5, creditDueDay: 12, isArchived: false },
];
const categories: CategoryRow[] = [
  { id: "cat-food", name: "Alimentação", group: "variable_expense", isArchived: false },
  { id: "cat-rent", name: "Moradia", group: "fixed_expense", isArchived: false },
  { id: "cat-salary", name: "Salário", group: "income", isArchived: false },
  { id: "cat-old", name: "Antiga", group: "variable_expense", isArchived: true },
  { id: "cat-pending", name: "A classificar", group: "variable_expense", isArchived: false },
];
const item: PluggyItemView = {
  id: "item-1", label: "Banco Teste", connectorName: "MeuPluggy", status: "UPDATED", collectedAt: "2026-07-16T10:00:00.000Z", nextAutoSyncAt: null, lastSyncedAt: null, lastErrorCode: null,
  remoteAccounts: [{ externalAccountId: "remote-1", name: "Corrente", kind: "bank", numberSuffix: "2345" }], accountsError: null,
};
const link: PluggyLinkView = { id: "link-1", itemId: "item-1", externalAccountId: "remote-1", accountId: "local-1", remoteName: "Corrente", kind: "bank", cutoffDate: "2026-01-01", isEnabled: true };
const successRun: PluggySyncRunView = {
  id: "run-1", startedAt: "2026-07-16T12:00:00.000Z", finishedAt: "2026-07-16T12:00:01.000Z", status: "success", errorCode: null,
  summary: { dryRun: false, items: { total: 1, failed: 0 }, accounts: { total: 1, failed: 0, skipped: 0 }, counts: {}, failures: [] },
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const emptyIdentity: PluggyIdentityView = { names: [], cpfMasked: null, otherOwnAccountId: null };

type Api = { items?: PluggyItemView[]; links?: PluggyLinkView[]; run?: PluggySyncRunView | null; running?: boolean; identity?: PluggyIdentityView; pending?: PluggyPendingCategoryGroup[]; onPost?: (url: string, body: unknown, method: string) => Response | Promise<Response> };

function stubApi({ items = [], links = [], run = null, running = false, identity = emptyIdentity, pending = [], onPost }: Api) {
  const calls: { url: string; method: string; body: unknown }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method !== "GET") {
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ url, method, body });
      return onPost?.(url, body, method) ?? json({ ok: true });
    }
    if (url.includes("/identity")) return json({ ok: true, identity });
    if (url.includes("/category-rules")) return json({ ok: true, pending });
    return url.includes("/sync") ? json({ ok: true, run, running }) : json({ ok: true, items, links });
  }));
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("Open Finance settings", () => {
  it("explains the setup and calls no API when not configured", () => {
    const calls = vi.fn();
    vi.stubGlobal("fetch", calls);
    renderUI(<OpenFinanceSettings configured={false} accounts={accounts} categories={categories} />);
    expect(screen.getByText("Open Finance não configurado")).toBeVisible();
    expect(screen.getByText("PLUGGY_CLIENT_SECRET")).toBeVisible();
    expect(calls).not.toHaveBeenCalled();
  });

  it("shows the empty state and adds an Item ID", async () => {
    const calls = stubApi({});
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    expect(await screen.findByText("Nenhum banco conectado")).toBeVisible();
    expect(screen.getByText("Nenhuma sincronização realizada.")).toBeVisible();
    await user.type(screen.getByLabelText("Nome do banco"), "Banco Teste");
    await user.type(screen.getByLabelText("Item ID"), " item-1 ");
    await user.click(screen.getByRole("button", { name: "Adicionar conexão" }));
    await waitFor(() => expect(screen.getByLabelText("Item ID")).toHaveValue(""));
    expect(calls).toEqual([{ url: "/api/pluggy/items", method: "POST", body: { externalItemId: "item-1", label: "Banco Teste" } }]);
  });

  it("links a remote account only to compatible local accounts", async () => {
    const calls = stubApi({ items: [item] });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    const select = await screen.findByLabelText("Conta local de Corrente");
    expect(within(select).queryByRole("option", { name: "Cartão local" })).toBeNull();
    expect(screen.getByText(/final 2345/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Vincular conta" })).toBeDisabled();
    await user.selectOptions(select, "local-1");
    await user.click(screen.getByRole("button", { name: "Vincular conta" }));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toMatchObject({ url: "/api/pluggy/links", method: "POST", body: { itemId: "item-1", externalAccountId: "remote-1", accountId: "local-1" } });
    expect(calls[0].body).toHaveProperty("cutoffDate", expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });

  it("edits and disables an existing link", async () => {
    const calls = stubApi({ items: [item], links: [link] });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    expect(await screen.findByText("Vinculada")).toBeVisible();
    await user.click(screen.getByRole("switch", { name: "Sincronizar Corrente" }));
    await user.click(screen.getByRole("button", { name: "Salvar vínculo" }));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toEqual({ url: "/api/pluggy/links", method: "PATCH", body: { id: "link-1", accountId: "local-1", cutoffDate: "2026-01-01", isEnabled: false } });
  });

  it("keeps saved links visible when Pluggy cannot list the accounts", async () => {
    stubApi({ items: [{ ...item, remoteAccounts: [], accountsError: "A Pluggy está indisponível no momento." }], links: [link] });
    renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("indisponível");
    expect(screen.getByLabelText("Conta local de Corrente")).toHaveValue("local-1");
  });

  it("disables the button while syncing and shows the success summary", async () => {
    let finish!: (response: Response) => void;
    stubApi({ items: [item], links: [link], onPost: () => new Promise<Response>((resolve) => { finish = resolve; }) });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    await screen.findByText("Vinculada");
    await user.click(screen.getByRole("button", { name: "Sincronizar bancos" }));
    expect(await screen.findByRole("button", { name: "Sincronizando…" })).toBeDisabled();
    finish(json({ ok: true, run: successRun }));
    const summary = await screen.findByRole("status", { name: "Última sincronização" });
    expect(summary).toHaveTextContent("Concluída");
    expect(summary).toHaveTextContent("1 conexões · 1 contas · 0 falhas");
    expect(screen.getByRole("button", { name: "Sincronizar bancos" })).toBeEnabled();
  });

  it("shows a run already in progress", async () => {
    stubApi({ running: true });
    renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    expect(await screen.findByRole("button", { name: "Sincronizando…" })).toBeDisabled();
  });

  it("lists the failures of a partial run", async () => {
    const failure = { scope: "account" as const, step: "account-check", targetId: "link-1", label: "Corrente", code: "PLUGGY_ACCOUNT_NOT_FOUND", message: "A conta não foi encontrada na Pluggy." };
    stubApi({ run: { ...successRun, status: "partial", summary: { ...successRun.summary!, failures: [failure] } } });
    renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    expect(await screen.findByText("Concluída com falhas")).toBeVisible();
    expect(screen.getByText(/A conta não foi encontrada/)).toBeVisible();
  });

  it("shows API errors from a failed sync and allows a retry", async () => {
    stubApi({ onPost: () => json({ ok: false, error: { code: "PLUGGY_SYNC_RUNNING", message: "Já existe uma sincronização em andamento." } }, 409) });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    await screen.findByText("Nenhum banco conectado");
    await user.click(screen.getByRole("button", { name: "Sincronizar bancos" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe uma sincronização");
    expect(screen.getByRole("button", { name: "Sincronizar bancos" })).toBeEnabled();
  });

  it("keeps the form when adding a connection fails", async () => {
    stubApi({ onPost: () => new Response("<html>", { status: 500 }) });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    await screen.findByText("Nenhum banco conectado");
    await user.type(screen.getByLabelText("Nome do banco"), "Banco");
    await user.type(screen.getByLabelText("Item ID"), "item-1");
    await user.click(screen.getByRole("button", { name: "Adicionar conexão" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível concluir");
    expect(screen.getByLabelText("Item ID")).toHaveValue("item-1");
  });

  it("reports a load failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(3));
    for (const alert of screen.getAllByRole("alert")) expect(alert).toHaveTextContent("offline");
  });

  it("shows counts per classification and the items that need attention", async () => {
    const summary = {
      ...successRun.summary!,
      counts: { bankOrdinary: 3, bankOwnTransfer: 1, bankCardPayment: 2, bankInvestmentWithdrawal: 1, bankIgnored: 0, itemsChecked: 1 },
      attention: [
        { reason: "possible_own_transfer" as const, accountLabel: "Corrente", description: "TED ENVIADA", date: "2026-03-10", amountCents: 12345 },
        { reason: "missing_other_own_account" as const, accountLabel: "Corrente", description: "PIX ENVIADO", date: "2026-03-11", amountCents: 500 },
      ],
    };
    stubApi({ run: { ...successRun, summary } });
    renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    const status = await screen.findByRole("status", { name: "Última sincronização" });
    expect(status).toHaveTextContent("3 lançamentos comuns · 1 transferências próprias · 2 pagamentos de fatura · 1 resgates");
    expect(status).not.toHaveTextContent("ignorados");
    expect(screen.getByText("Itens que precisam de atenção")).toBeVisible();
    expect(screen.getByText("TED ENVIADA")).toBeVisible();
    expect(screen.getByText(/R\$\s*123,45/)).toBeVisible();
    expect(screen.getByText(/Pode ser transferência própria/)).toBeVisible();
    expect(screen.getByText(/Escolha uma conta em Outras contas próprias/)).toBeVisible();
  });

  it("renders a run stored before bank imports existed", async () => {
    const { attention: _attention, ...legacy } = { ...successRun.summary!, attention: [] };
    void _attention;
    stubApi({ run: { ...successRun, summary: legacy } });
    renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    expect(await screen.findByText("Concluída")).toBeVisible();
    expect(screen.queryByText("Itens que precisam de atenção")).toBeNull();
  });

  it("saves the owner identity and offers only eligible destination accounts", async () => {
    const saved: PluggyIdentityView = { names: ["João da Silva", "Joao Silva"], cpfMasked: "***.456.789-**", otherOwnAccountId: "local-1" };
    const calls = stubApi({ onPost: () => json({ ok: true, identity: saved }) });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    const names = await screen.findByLabelText("Nomes completos do titular");
    expect(within(screen.getByLabelText("Outras contas próprias")).queryByRole("option", { name: "Cartão local" })).toBeNull();
    await user.type(names, "João da Silva{enter}{enter} Joao Silva ");
    await user.type(screen.getByLabelText("CPF do titular"), " 123.456.789-09 ");
    await user.selectOptions(screen.getByLabelText("Outras contas próprias"), "local-1");
    await user.click(screen.getByRole("button", { name: "Salvar identidade" }));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toEqual({ url: "/api/pluggy/identity", method: "PUT", body: { names: ["João da Silva", "Joao Silva"], otherOwnAccountId: "local-1", cpf: "123.456.789-09" } });
    expect(await screen.findByText("Identidade salva.")).toBeVisible();
    expect(screen.getByLabelText("CPF do titular")).toHaveValue("");
  });

  it("loads the stored identity and keeps the CPF when left blank", async () => {
    const identity: PluggyIdentityView = { names: ["João da Silva"], cpfMasked: "***.456.789-**", otherOwnAccountId: null };
    const calls = stubApi({ identity });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    expect(await screen.findByLabelText("Nomes completos do titular")).toHaveValue("João da Silva");
    expect(screen.getByLabelText("CPF do titular")).toHaveAttribute("placeholder", "***.456.789-**");
    expect(screen.getByText("Deixe em branco para manter o CPF salvo.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Salvar identidade" }));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].body).toEqual({ names: ["João da Silva"], otherOwnAccountId: null });
  });

  it("reports a failure to save the identity", async () => {
    stubApi({ onPost: () => json({ ok: false, error: { code: "INVALID_PLUGGY_REQUEST", message: "Dados inválidos." } }, 400) });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    await user.click(await screen.findByRole("button", { name: "Salvar identidade" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Dados inválidos.");
    expect(screen.queryByText("Identidade salva.")).toBeNull();
  });

  it("removes a connection only after confirmation", async () => {
    const calls = stubApi({ items: [item] });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
    await user.click(await screen.findByRole("button", { name: "Remover" }));
    expect(calls).toEqual([]);
    await user.click(await screen.findByRole("button", { name: "Remover conexão" }));
    await waitFor(() => expect(calls).toEqual([{ url: "/api/pluggy/items?id=item-1", method: "DELETE", body: undefined }]));
  });

  it("redirects when the session expired or is locked", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    for (const [status, target] of [[401, "/login"], [423, "/lock"]] as const) {
      vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status })));
      const { unmount } = renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);
      await waitFor(() => expect(assign).toHaveBeenCalledWith(target));
      unmount();
    }
  });

  describe("category review", () => {
    const market: PluggyPendingCategoryGroup = { normalizedDescription: "MERCADO BOM", direction: "expense", occurrences: 2, totalCents: 15050 };
    const salary: PluggyPendingCategoryGroup = { normalizedDescription: "SALARIO EMPRESA", direction: "income", occurrences: 1, totalCents: 500000 };
    const open = () => renderUI(<OpenFinanceSettings configured accounts={accounts} categories={categories} />);

    it("shows the empty state", async () => {
      stubApi({});
      open();
      expect(await screen.findByText("Nenhuma pendência de categoria.")).toBeVisible();
    });

    it("lists each description with its count, total and only compatible active categories", async () => {
      stubApi({ pending: [market, salary] });
      open();
      const select = await screen.findByLabelText("Categoria de MERCADO BOM");
      expect(screen.getByText(/Despesa · 2 lançamentos/)).toHaveTextContent("R$ 150,50");
      expect(screen.getByText(/Receita · 1 lançamento/)).toHaveTextContent("R$ 5.000,00");
      expect(within(select).getAllByRole("option").map((option) => option.textContent)).toEqual(["Selecione uma categoria", "Alimentação", "Moradia"]);
      expect(within(screen.getByLabelText("Categoria de SALARIO EMPRESA")).getAllByRole("option").map((option) => option.textContent)).toEqual(["Selecione uma categoria", "Salário"]);
    });

    it("shows progress while applying and removes the resolved description", async () => {
      let finish: (response: Response) => void = () => undefined;
      const calls = stubApi({ pending: [market, salary], onPost: () => new Promise<Response>((resolve) => { finish = resolve; }) });
      const { user } = open();
      await user.selectOptions(await screen.findByLabelText("Categoria de MERCADO BOM"), "cat-food");
      expect(await screen.findByText("Aplicando categoria…")).toBeVisible();
      expect(screen.getByLabelText("Categoria de SALARIO EMPRESA")).toBeDisabled();
      expect(calls).toEqual([{ url: "/api/pluggy/category-rules", method: "POST", body: { normalizedDescription: "MERCADO BOM", direction: "expense", categoryId: "cat-food" } }]);
      finish(json({ ok: true, applied: 2, pending: [salary] }));
      await waitFor(() => expect(screen.queryByLabelText("Categoria de MERCADO BOM")).toBeNull());
      expect(screen.queryByText("Aplicando categoria…")).toBeNull();
      expect(screen.getByLabelText("Categoria de SALARIO EMPRESA")).toBeEnabled();
    });

    it("keeps the row and reports a failure", async () => {
      stubApi({ pending: [market], onPost: () => json({ ok: false, error: { code: "PLUGGY_CATEGORY_RULE_INVALID", message: "Categoria recusada." } }, 400) });
      const { user } = open();
      await user.selectOptions(await screen.findByLabelText("Categoria de MERCADO BOM"), "cat-food");
      expect(await screen.findByText("Categoria recusada.")).toBeVisible();
      expect(screen.getByLabelText("Categoria de MERCADO BOM")).toBeEnabled();
    });

    it("reports a failure to load", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("/category-rules") ? json({ ok: false, error: { code: "X", message: "Falha nas pendências." } }, 500) : url.includes("/identity") ? json({ ok: true, identity: emptyIdentity }) : url.includes("/sync") ? json({ ok: true, run: null, running: false }) : json({ ok: true, items: [], links: [] })));
      open();
      expect(await screen.findByText("Falha nas pendências.")).toBeVisible();
    });

    it("masks totals in privacy mode", async () => {
      stubApi({ pending: [market] });
      renderUI(<FinancialPrivacyContext value={{ hidden: true, setHidden: vi.fn() }}><OpenFinanceSettings configured accounts={accounts} categories={categories} /></FinancialPrivacyContext>);
      await screen.findByLabelText("Categoria de MERCADO BOM");
      expect(screen.queryByText(/150,50/)).toBeNull();
      expect(within(screen.getByText(/Despesa · 2 lançamentos/)).getByRole("img", { name: HIDDEN_FINANCIAL_VALUE })).toBeVisible();
    });
  });
});
