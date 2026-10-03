import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/(finance)/transactions/page";
import { listAccounts } from "@/lib/server/accounts";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";

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
