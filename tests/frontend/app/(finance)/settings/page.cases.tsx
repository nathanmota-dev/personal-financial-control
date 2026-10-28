import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/(finance)/settings/page";
import { listAccounts } from "@/lib/server/accounts";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";

describe("app/(finance)/settings/page", () => {
  it("loads the requested month and presents real fixture data", async () => {
    renderUI(await Page());
    expect(requirePageSession).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("heading", { name: "Configurações" }),
    ).toBeVisible();
    expect(screen.getByText("Visa Platinum")).toBeVisible();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Contas", "Categorias"]);
  });
  it("separates security and MCP settings into their own tabs without a sign-out shortcut", async () => {
    vi.mocked(requirePageSession).mockResolvedValueOnce({
      user: { lockTimeoutMinutes: 15, lockOnClose: true, mcpTokenHash: null },
    } as never);
    const { user } = renderUI(await Page());
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Contas", "Categorias", "Segurança", "MCP"]);
    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Segurança" }));
    expect(screen.getByRole("slider", { name: "Tempo de inatividade" }).getAttribute("aria-valuetext")).toBe("15 min");
    expect(screen.getByText("Trocar PIN", { selector: "[data-slot=card-title]" })).toBeVisible();
    expect(screen.queryByText("Token MCP")).toBeNull();
    await user.click(screen.getByRole("tab", { name: "MCP" }));
    expect(screen.getByRole("button", { name: "Gerar token" })).toBeVisible();
  });
  it("renders a usable fallback after data loading fails", async () => {
    vi.mocked(listAccounts).mockRejectedValueOnce(new Error("offline"));
    renderUI(await Page());
    expect(
      screen.getByRole("heading", { name: "Configurações" }),
    ).toBeVisible();
    expect(
      screen.getByText("Nenhuma conta cadastrada", { exact: false }),
    ).toBeVisible();
  });
  it("rejects an unauthenticated page load before retrieving data", async () => {
    vi.mocked(requirePageSession).mockRejectedValueOnce(
      new Error("REDIRECT:/login"),
    );
    await expect(Page()).rejects.toThrow("REDIRECT:/login");
    expect(listAccounts).not.toHaveBeenCalled();
  });
});
