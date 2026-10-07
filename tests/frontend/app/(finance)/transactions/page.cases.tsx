import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/(finance)/transactions/page";
import { listAccounts } from "@/lib/server/accounts";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";
import { navigation } from "@/tests/frontend/setup";

describe("app/(finance)/transactions/page", () => {
  it("loads the requested month and presents real fixture data", async () => {
    renderUI(
      await Page({ searchParams: Promise.resolve({ month: "2026-07" }) }),
    );
    expect(requirePageSession).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Lançamentos" })).toBeVisible();
    expect(
      screen.getByRole("row", { name: /Salário mensal/ }),
    ).toHaveTextContent("6.500,00");
  });
  it("renders a usable fallback after data loading fails", async () => {
    vi.mocked(listAccounts).mockRejectedValueOnce(new Error("offline"));
    renderUI(
      await Page({ searchParams: Promise.resolve({ month: "invalid" }) }),
    );
    expect(screen.getByRole("heading", { name: "Lançamentos" })).toBeVisible();
  });
  it("opens a requested expense with the valid month and consumes its URL intent", async () => {
    navigation.pathname = "/transactions";
    navigation.search = new URLSearchParams(
      "month=2026-07&command=new-expense&commandId=request-1",
    );
    renderUI(
      await Page({
        searchParams: Promise.resolve({ month: "2026-07" }),
      }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Novo lançamento",
    });
    expect(dialog.querySelector('input[name="competenceMonth"]')).toHaveValue(
      "2026-07",
    );
    expect(screen.getByRole("combobox", { name: "Tipo" })).toHaveTextContent(
      "Despesa",
    );
    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith(
        "/transactions?month=2026-07",
        { scroll: false },
      );
    });
  });
  it("rejects an unauthenticated page load before retrieving data", async () => {
    vi.mocked(requirePageSession).mockRejectedValueOnce(
      new Error("REDIRECT:/login"),
    );
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(listAccounts).not.toHaveBeenCalled();
  });
});
