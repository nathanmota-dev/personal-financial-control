import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OpenFinanceSettings } from "@/components/finance/open-finance/open-finance-settings";
import type { AccountRow } from "@/lib/interfaces/components/settings-view";
import type { PluggyItemView, PluggyLinkView, PluggySyncRunView } from "@/lib/interfaces/pluggy";
import { renderUI } from "@/tests/frontend/helpers";

const accounts: AccountRow[] = [
  { id: "local-1", name: "Conta local", type: "checking", initialBalanceCents: 0, currentBalanceCents: 0, creditClosingDay: null, creditDueDay: 10, isArchived: false },
  { id: "local-2", name: "Cartão local", type: "credit", initialBalanceCents: 0, currentBalanceCents: 0, creditClosingDay: 5, creditDueDay: 12, isArchived: false },
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

type Api = { items?: PluggyItemView[]; links?: PluggyLinkView[]; run?: PluggySyncRunView | null; running?: boolean; onPost?: (url: string, body: unknown, method: string) => Response | Promise<Response> };

function stubApi({ items = [], links = [], run = null, running = false, onPost }: Api) {
  const calls: { url: string; method: string; body: unknown }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (method !== "GET") {
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ url, method, body });
      return onPost?.(url, body, method) ?? json({ ok: true });
    }
    return url.includes("/sync") ? json({ ok: true, run, running }) : json({ ok: true, items, links });
  }));
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("Open Finance settings", () => {
  it("explains the setup and calls no API when not configured", () => {
    const calls = vi.fn();
    vi.stubGlobal("fetch", calls);
    renderUI(<OpenFinanceSettings configured={false} accounts={accounts} />);
    expect(screen.getByText("Open Finance não configurado")).toBeVisible();
    expect(screen.getByText("PLUGGY_CLIENT_SECRET")).toBeVisible();
    expect(calls).not.toHaveBeenCalled();
  });

  it("shows the empty state and adds an Item ID", async () => {
    const calls = stubApi({});
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} />);
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
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} />);
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
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} />);
    expect(await screen.findByText("Vinculada")).toBeVisible();
    await user.click(screen.getByRole("switch", { name: "Sincronizar Corrente" }));
    await user.click(screen.getByRole("button", { name: "Salvar vínculo" }));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toEqual({ url: "/api/pluggy/links", method: "PATCH", body: { id: "link-1", accountId: "local-1", cutoffDate: "2026-01-01", isEnabled: false } });
  });

  it("keeps saved links visible when Pluggy cannot list the accounts", async () => {
    stubApi({ items: [{ ...item, remoteAccounts: [], accountsError: "A Pluggy está indisponível no momento." }], links: [link] });
    renderUI(<OpenFinanceSettings configured accounts={accounts} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("indisponível");
    expect(screen.getByLabelText("Conta local de Corrente")).toHaveValue("local-1");
  });

  it("disables the button while syncing and shows the success summary", async () => {
    let finish!: (response: Response) => void;
    stubApi({ items: [item], links: [link], onPost: () => new Promise<Response>((resolve) => { finish = resolve; }) });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} />);
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
    renderUI(<OpenFinanceSettings configured accounts={accounts} />);
    expect(await screen.findByRole("button", { name: "Sincronizando…" })).toBeDisabled();
  });

  it("lists the failures of a partial run", async () => {
    const failure = { scope: "account" as const, step: "account-check", targetId: "link-1", label: "Corrente", code: "PLUGGY_ACCOUNT_NOT_FOUND", message: "A conta não foi encontrada na Pluggy." };
    stubApi({ run: { ...successRun, status: "partial", summary: { ...successRun.summary!, failures: [failure] } } });
    renderUI(<OpenFinanceSettings configured accounts={accounts} />);
    expect(await screen.findByText("Concluída com falhas")).toBeVisible();
    expect(screen.getByText(/A conta não foi encontrada/)).toBeVisible();
  });

  it("shows API errors from a failed sync and allows a retry", async () => {
    stubApi({ onPost: () => json({ ok: false, error: { code: "PLUGGY_SYNC_RUNNING", message: "Já existe uma sincronização em andamento." } }, 409) });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} />);
    await screen.findByText("Nenhum banco conectado");
    await user.click(screen.getByRole("button", { name: "Sincronizar bancos" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe uma sincronização");
    expect(screen.getByRole("button", { name: "Sincronizar bancos" })).toBeEnabled();
  });

  it("keeps the form when adding a connection fails", async () => {
    stubApi({ onPost: () => new Response("<html>", { status: 500 }) });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} />);
    await screen.findByText("Nenhum banco conectado");
    await user.type(screen.getByLabelText("Nome do banco"), "Banco");
    await user.type(screen.getByLabelText("Item ID"), "item-1");
    await user.click(screen.getByRole("button", { name: "Adicionar conexão" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível concluir");
    expect(screen.getByLabelText("Item ID")).toHaveValue("item-1");
  });

  it("reports a load failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    renderUI(<OpenFinanceSettings configured accounts={accounts} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("offline");
  });

  it("removes a connection only after confirmation", async () => {
    const calls = stubApi({ items: [item] });
    const { user } = renderUI(<OpenFinanceSettings configured accounts={accounts} />);
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
      const { unmount } = renderUI(<OpenFinanceSettings configured accounts={accounts} />);
      await waitFor(() => expect(assign).toHaveBeenCalledWith(target));
      unmount();
    }
  });
});
