import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/(finance)/recurring/page";
import { listAccounts } from "@/lib/server/accounts";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";

describe("app/(finance)/recurring/page", () => {
  it("loads the requested month and presents real fixture data", async () => {
    renderUI(
      await Page({ searchParams: Promise.resolve({ month: "2026-07" }) }),
    );
    expect(requirePageSession).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Recorrentes" })).toBeVisible();
    expect(screen.getByText("Salário mensal")).toBeVisible();
  });
  it("renders a usable fallback after data loading fails", async () => {
    vi.mocked(listAccounts).mockRejectedValueOnce(new Error("offline"));
    renderUI(
      await Page({ searchParams: Promise.resolve({ month: "invalid" }) }),
    );
    expect(screen.getByRole("heading", { name: "Recorrentes" })).toBeVisible();
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
