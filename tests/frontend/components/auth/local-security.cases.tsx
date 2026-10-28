import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LockForm } from "@/components/auth/lock-form";
import { SecuritySettings } from "@/components/auth/security-settings";
import { McpTokenSettings } from "@/components/auth/mcp-token-settings";
import { renderUI } from "../../helpers";
function locationMock() {
  const assign = vi.fn();
  vi.stubGlobal("window", new Proxy(window, { get: (target, key) => key === "location" ? { assign } : Reflect.get(target, key, target) }));
  return assign;
}
function fillPin(label: string, value: string) { fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value } }); }
describe("local security UI", () => {
  it("confirms a new PIN before setup and navigates to the original destination", async () => {
    const assign = locationMock();
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetcher);
    const { user } = renderUI(<LockForm setup destination="/goals" attempts={0} />);
    fillPin("PIN", "123456"); fillPin("Confirmar PIN", "111111");
    await user.click(screen.getByRole("button", { name: "Definir PIN" }));
    expect(screen.getAllByRole("status")[0].textContent).toContain("Os PINs não coincidem.");
    expect(fetcher).not.toHaveBeenCalled();
    fillPin("Confirmar PIN", "123456");
    await user.click(screen.getByRole("button", { name: "Definir PIN" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/goals"));
  });
  it("shows wrong attempts then redirects on lockout", async () => {
    const assign = locationMock();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ remaining: 1 }) }).mockResolvedValueOnce({ status: 401 }));
    const { user } = renderUI(<LockForm setup={false} destination="/dashboard" attempts={3} />);
    fillPin("PIN", "000000"); await user.click(screen.getByRole("button", { name: "Destravar" }));
    expect(await screen.findByText("1 tentativas restantes.")).toBeVisible();
    fillPin("PIN", "000000"); await user.click(screen.getByRole("button", { name: "Destravar" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"));
  });
  it("requests a Google reauthentication for forgotten PINs", async () => {
    const assign = locationMock(); const fetcher = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", fetcher);
    const { user } = renderUI(<LockForm setup={false} destination="/goals" attempts={0} />);
    await user.click(screen.getByRole("button", { name: "Esqueci o PIN" }));
    expect(fetcher).toHaveBeenCalledWith("/api/session", { method: "DELETE", headers: { "x-session-intent": "pin-reset" } });
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login?next=%2Fgoals"));
  });
  it("saves timeout preferences and requires matching PIN confirmation", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }); vi.stubGlobal("fetch", fetcher);
    const { user } = renderUI(<SecuritySettings lockTimeoutMinutes={15} lockOnClose hasMcpToken={false} />);
    fireEvent.change(screen.getByLabelText("Minutos de inatividade (1–120)"), { target: { value: "30" } });
    await user.click(screen.getByRole("button", { name: /^Salvar$/ }));
    await screen.findByText("Configurações salvas.");
    expect(fetcher).toHaveBeenCalledWith("/api/security", expect.objectContaining({ body: JSON.stringify({ lockTimeoutMinutes: 30, lockOnClose: true }) }));
    fillPin("PIN atual", "123456"); fillPin("Novo PIN", "654321"); fillPin("Confirmar PIN", "111111");
    await user.click(screen.getByRole("button", { name: "Trocar PIN" }));
    expect(await screen.findByText("Os PINs não coincidem.")).toBeVisible();
    fillPin("Confirmar PIN", "654321"); await user.click(screen.getByRole("button", { name: "Trocar PIN" }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/pin", expect.objectContaining({ method: "PATCH" })));
  });
  it("reveals generated tokens only until hidden and supports revocation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "once-only-token" }) }));
    const { user } = renderUI(<McpTokenSettings hasMcpToken={false} />);
    await user.click(screen.getByRole("button", { name: "Gerar token" }));
    expect(await screen.findByText("once-only-token")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Copiar" }));
    expect(await screen.findByText("Token copiado.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Ocultar" }));
    expect(screen.queryByText("once-only-token")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Revogar token" }));
    expect(await screen.findByText("Token revogado.")).toBeVisible();
  });
});
