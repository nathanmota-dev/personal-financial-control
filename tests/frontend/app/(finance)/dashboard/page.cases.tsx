import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/(finance)/dashboard/page";
import { getDashboardData } from "@/lib/server/dashboard";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";

describe("app/(finance)/dashboard/page", () => {
  it("loads the requested month with one dashboard call after authentication", async () => {
    renderUI(await Page({ searchParams: Promise.resolve({ month: "2026-07" }) }));
    expect(requirePageSession).toHaveBeenCalledOnce();
    expect(getDashboardData).toHaveBeenCalledExactlyOnceWith("2026-07");
    expect(screen.getByRole("heading", { name: "Visão mensal" })).toBeVisible();
    expect(screen.getByRole("article", { name: "Receitas" })).toHaveTextContent("6.500,00");
    expect(screen.getByText("Longo prazo")).toBeVisible();
  });
  it("propagates query failures to the retry boundary", async () => {
    vi.mocked(getDashboardData).mockRejectedValueOnce(new Error("offline"));
    await expect(Page({ searchParams: Promise.resolve({ month: "invalid" }) })).rejects.toThrow("offline");
    expect(getDashboardData).toHaveBeenCalledWith("2026-07");
  });
  it("normalizes repeated search params and rejects unauthenticated loads before retrieving data", async () => {
    await Page({ searchParams: Promise.resolve({ month: ["2026-01", "2026-02"] }) });
    expect(getDashboardData).toHaveBeenCalledWith("2026-07");
    vi.mocked(getDashboardData).mockClear();
    vi.mocked(requirePageSession).mockRejectedValueOnce(new Error("REDIRECT:/login"));
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/login");
    expect(getDashboardData).not.toHaveBeenCalled();
  });
});
