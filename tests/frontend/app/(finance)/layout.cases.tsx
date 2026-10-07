import { act, screen } from "@testing-library/react";
import { lazy } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import Layout from "@/app/(finance)/layout";
import { requirePageSession } from "@/lib/auth/server";
import { getOnboarding } from "@/lib/server/onboarding";
import { FinancialPrivacyToggle } from "@/components/finance/privacy/privacy-toggle";
import { financialPrivacyKey } from "@/lib/financial-privacy";

it.each([null, "visible", "hidden"])("hydrates a delayed financial shell before applying preference %s", async (preference) => {
  if (preference) localStorage.setItem(financialPrivacyKey(true), preference);
  const container = document.createElement("div");
  container.innerHTML = renderToString(await Layout({ children: <FinancialPrivacyToggle /> }));
  document.body.append(container);
  expect(container.textContent).toContain("Mostrar valores");
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  const DeferredToggle = lazy(async () => {
    await ready;
    return { default: FinancialPrivacyToggle };
  });
  const client = await Layout({ children: <DeferredToggle /> });
  const recovered = vi.fn();
  const root = hydrateRoot(container, client, { onRecoverableError: recovered });
  try {
    await act(async () => {});
    expect(container.textContent).toContain("Mostrar valores");
    await act(async () => { release(); await ready; });
    expect(recovered).not.toHaveBeenCalled();
    expect(container.textContent).toContain(preference === "hidden" ? "Mostrar valores" : "Ocultar valores");
  } finally {
    await act(() => root.unmount());
    container.remove();
  }
});
it.each([
  { name: "Ana Lima", picture: "/ana.jpg" },
  { name: "", picture: 42 },
  { name: undefined, picture: null },
])("normalizes session presentation %j", async (session) => {
  vi.mocked(requirePageSession).mockResolvedValueOnce(session as never);
  renderUI(await Layout({ children: <h1>Minha página</h1> }));
  expect(screen.getByRole("heading", { name: "Minha página" })).toBeVisible();
  if (!session.name)
    expect(screen.getAllByText("Usuário").length).toBeGreaterThan(0);
  else expect(screen.getAllByText(session.name).length).toBeGreaterThan(0);
});
it("queries progress by UID and suppresses completed onboarding", async () => {
  vi.stubEnv("DEMO_MODE", "false");
  vi.mocked(requirePageSession).mockResolvedValueOnce({ uid: "google-user", name: "Ana" } as never);
  vi.mocked(getOnboarding).mockResolvedValueOnce({ step: 5, completedAt: "2026-10-03" });
  renderUI(await Layout({ children: <h1>Dashboard</h1> }));
  expect(getOnboarding).toHaveBeenCalledWith("google-user");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("keeps the app accessible when progress lookup fails", async () => {
  vi.stubEnv("DEMO_MODE", "false");
  vi.mocked(requirePageSession).mockResolvedValueOnce({ uid: "google-user", name: "Ana" } as never);
  vi.mocked(getOnboarding).mockRejectedValueOnce(new Error("offline"));
  renderUI(await Layout({ children: <h1>Dashboard</h1> }));
  expect(screen.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
});
