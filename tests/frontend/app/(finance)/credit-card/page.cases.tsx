import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/(finance)/credit-card/page";
import { getCreditCardDefaultMonth, getCreditCardOverview, getCreditCardShowcase } from "@/lib/server/credit-card";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";

describe("app/(finance)/credit-card/page", () => {
  it("loads the requested month and presents real fixture data", async () => {
    renderUI(
      await Page({ searchParams: Promise.resolve({ month: "2026-07" }) }),
    );
    expect(requirePageSession).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("heading", { name: "Cartões", level: 1 }),
    ).toBeVisible();
    expect(getCreditCardDefaultMonth).not.toHaveBeenCalled();
  });
  it("opens the selected card's open invoice when no month is requested", async () => {
    vi.mocked(getCreditCardDefaultMonth).mockResolvedValueOnce("2026-08");
    renderUI(await Page({ searchParams: Promise.resolve({ card: "card-1" }) }));
    expect(getCreditCardDefaultMonth).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), "card-1");
    expect(getCreditCardShowcase).toHaveBeenCalledWith("2026-08");
    expect(getCreditCardOverview).toHaveBeenCalledWith("2026-08", undefined, { accountId: undefined });
  });
  it("renders a usable fallback after data loading fails", async () => {
    vi.mocked(getCreditCardOverview).mockRejectedValueOnce(
      new Error("offline"),
    );
    renderUI(
      await Page({ searchParams: Promise.resolve({ month: "invalid" }) }),
    );
    expect(
      screen.getByRole("heading", { name: "Cartões", level: 1 }),
    ).toBeVisible();
  });
  it("rejects an unauthenticated page load before retrieving data", async () => {
    vi.mocked(requirePageSession).mockRejectedValueOnce(
      new Error("REDIRECT:/login"),
    );
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(getCreditCardOverview).not.toHaveBeenCalled();
  });
});
