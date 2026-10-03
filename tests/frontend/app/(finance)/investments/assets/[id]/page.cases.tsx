import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import Page from "@/app/(finance)/investments/assets/[id]/page";
import { getInvestmentAssetDetails } from "@/lib/server/investment-operations";
import { requirePageSession } from "@/lib/auth/server";
import fixtures from "@/tests/frontend/fixtures/finance.json";
import { renderUI } from "@/tests/frontend/helpers";
it("loads an authorized asset by its route parameter", async () => {
  vi.mocked(getInvestmentAssetDetails).mockResolvedValueOnce(
    fixtures.stockAsset as never,
  );
  renderUI(
    await Page({ params: Promise.resolve({ id: fixtures.stockAsset!.id }) }),
  );
  expect(getInvestmentAssetDetails).toHaveBeenCalledWith(
    fixtures.stockAsset!.id,
  );
  expect(
    screen.getByRole("heading", { name: fixtures.stockAsset!.name }),
  ).toBeVisible();
});
it("returns notFound for an absent asset", async () => {
  await expect(
    Page({ params: Promise.resolve({ id: "missing" }) }),
  ).rejects.toThrow("NOT_FOUND");
});
it("checks authentication before asset access", async () => {
  vi.mocked(requirePageSession).mockRejectedValueOnce(
    new Error("REDIRECT:/login"),
  );
  await expect(
    Page({ params: Promise.resolve({ id: "missing" }) }),
  ).rejects.toThrow("REDIRECT:/login");
  expect(getInvestmentAssetDetails).not.toHaveBeenCalled();
});
