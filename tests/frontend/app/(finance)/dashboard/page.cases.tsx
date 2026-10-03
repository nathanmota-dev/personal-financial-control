import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/(finance)/dashboard/page";
import { getMonthlyDashboard } from "@/lib/server/dashboard";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";

describe("app/(finance)/dashboard/page", () => {
  it("loads the requested month and presents real fixture data", async () => {
    renderUI(
      await Page({ searchParams: Promise.resolve({ month: "2026-07" }) }),
    );
    expect(requirePageSession).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Visão mensal" })).toBeVisible();
    expect(
      screen.getByText("Entradas confirmadas no mês").closest("article"),
    ).toHaveTextContent("6.500,00");
  });
  it("renders a usable fallback after data loading fails", async () => {
    vi.mocked(getMonthlyDashboard).mockRejectedValueOnce(new Error("offline"));
    renderUI(
      await Page({ searchParams: Promise.resolve({ month: "invalid" }) }),
    );
    expect(screen.getByRole("heading", { name: "Visão mensal" })).toBeVisible();
  });
  it("rejects an unauthenticated page load before retrieving data", async () => {
    vi.mocked(requirePageSession).mockRejectedValueOnce(
      new Error("REDIRECT:/login"),
    );
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(getMonthlyDashboard).not.toHaveBeenCalled();
  });
});
