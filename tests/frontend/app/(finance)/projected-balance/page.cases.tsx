import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import Page from "@/app/(finance)/projected-balance/page";
import { listAccounts } from "@/lib/server/accounts";
import { getProjectedBalance } from "@/lib/server/projected-balance";
import { DomainError } from "@/lib/server/errors";
import { renderUI } from "@/tests/frontend/helpers";

describe("projection page", () => {
  it("loads explicit filters, repeated accounts and daily financial values", async () => {
    renderUI(
      await Page({
        searchParams: Promise.resolve({
          period: "next_30_days",
          startDate: "2026-07-16",
          accountIds: [],
          ignored: undefined,
        }),
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Saldo projetado" }),
    ).toBeVisible();
    expect(getProjectedBalance).toHaveBeenCalled();
    expect(screen.getByText("Saldo atual")).toBeVisible();
  });
  it("provides setup when there are no projectable accounts", async () => {
    vi.mocked(listAccounts).mockResolvedValueOnce([]);
    renderUI(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Nenhuma conta projetável")).toBeVisible();
    expect(getProjectedBalance).not.toHaveBeenCalled();
  });
  it.each([
    new Error("offline"),
    new DomainError("INVALID", "Invalid query"),
    new ZodError([]),
  ])("presents observable projection failures: %s", async (error) => {
    vi.mocked(getProjectedBalance).mockRejectedValueOnce(error);
    renderUI(await Page({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByText(
        error instanceof Error &&
          !(error instanceof DomainError) &&
          !(error instanceof ZodError)
          ? "Não foi possível carregar o saldo projetado agora."
          : /Não foi possível calcular a projeção/,
      ),
    ).toBeVisible();
  });
  it("reports invalid filters and account loading errors", async () => {
    const { unmount } = renderUI(
      await Page({ searchParams: Promise.resolve({ period: "invalid" }) }),
    );
    expect(
      screen.getByText(/Não foi possível calcular a projeção/),
    ).toBeVisible();
    unmount();
    vi.mocked(listAccounts).mockRejectedValueOnce(new Error("offline"));
    renderUI(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Nenhuma conta projetável")).toBeVisible();
  });
});
