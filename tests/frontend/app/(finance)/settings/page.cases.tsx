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
      screen.getByRole("heading", { name: "Contas e categorias" }),
    ).toBeVisible();
    expect(screen.getByText("Visa Platinum")).toBeVisible();
  });
  it("renders a usable fallback after data loading fails", async () => {
    vi.mocked(listAccounts).mockRejectedValueOnce(new Error("offline"));
    renderUI(await Page());
    expect(
      screen.getByRole("heading", { name: "Contas e categorias" }),
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
