import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatabaseSyncProvider } from "@/components/finance/database-sync-provider";
import { DatabaseSyncIndicator } from "@/components/finance/database-sync-indicator";
import { useDatabaseSync } from "@/lib/database-sync-context";
import { resetRecurringGeneration } from "@/lib/recurring-generation-session";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/recurring-generation-session", () => ({ resetRecurringGeneration: vi.fn() }));
const status = { mode: "replica" as const, state: "ready" as const, revision: 1, lastSuccessfulSyncAt: "2026-10-29T00:00:00Z", intervalSeconds: 30 };
function Editor() {
  const { canWrite } = useDatabaseSync();
  return <><input aria-label="Descrição" defaultValue="rascunho" /><button disabled={!canWrite}>Salvar</button></>;
}
function show(initial = status) {
  return render(<DatabaseSyncProvider initialStatus={initial}><DatabaseSyncIndicator /><Editor /></DatabaseSyncProvider>);
}
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("database synchronization interface", () => {
  it("shows state, syncs manually, refreshes external changes and preserves form input", async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: 200, json: async () => ({ status: { ...status, revision: 2 } }) });
    vi.stubGlobal("fetch", fetcher);
    show();
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "não perder" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Sincronizar agora" })); });
    expect(fetcher).toHaveBeenCalledWith("/api/database/sync", expect.objectContaining({ method: "POST" }));
    expect(screen.getByLabelText("Descrição")).toHaveValue("não perder");
    expect(router.refresh).toHaveBeenCalledOnce();
    expect(resetRecurringGeneration).toHaveBeenCalledOnce();
  });
  it("continues showing cached data and disables writes during a failed sync, then recovers", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ status: 200, json: async () => ({ status }) });
    vi.stubGlobal("fetch", fetcher);
    show();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Sincronizar agora" })); });
    expect(screen.getByText(/somente consulta/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(screen.getByLabelText("Descrição")).toHaveValue("rascunho");
    await act(async () => { fireEvent(window, new Event("online")); });
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });
  it("polls status without syncing, resumes on focus, and does not refresh while editing", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue({ status: 200, json: async () => ({ status: { ...status, revision: 2 } }) });
    vi.stubGlobal("fetch", fetcher);
    const { unmount } = show();
    screen.getByLabelText("Descrição").focus();
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(fetcher).toHaveBeenCalledWith("/api/database/sync", expect.objectContaining({ method: "GET" }));
    expect(router.refresh).not.toHaveBeenCalled();
    screen.getByLabelText("Descrição").blur();
    await act(async () => { fireEvent(window, new Event("focus")); });
    expect(router.refresh).toHaveBeenCalledOnce();
    unmount();
    const calls = fetcher.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });
  it("handles expired authorization and degraded service responses", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ status: 423 }).mockResolvedValue({ status: 503, json: async () => ({ status: { ...status, state: "unavailable" } }) });
    vi.stubGlobal("fetch", fetcher);
    show();
    await act(async () => { fireEvent(window, new Event("focus")); });
    expect(router.refresh).toHaveBeenCalledOnce();
    await act(async () => { fireEvent(window, new Event("online")); });
    expect(screen.getByText(/somente consulta/)).toBeVisible();
  });
  it("does not display or poll synchronization in non-replica installations", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    render(<DatabaseSyncProvider initialStatus={{ ...status, mode: "demo" }}><DatabaseSyncIndicator /></DatabaseSyncProvider>);
    await vi.advanceTimersByTimeAsync(60000);
    expect(screen.queryByLabelText("Sincronização do banco")).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
