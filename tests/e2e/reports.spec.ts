import { test, expect } from "./helpers/fixture";

test("report URL preserves mode, navigation and explicit invalid periods", async ({ page }) => {
  await page.goto("/reports?mode=monthly&period=2026-07");
  await expect(page.getByRole("heading", { name: "Relatórios", exact: true })).toBeVisible();
  await expect(page.getByText("Período parcial.", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Período anterior", exact: true }).click();
  await expect(page).toHaveURL(/mode=monthly&period=2026-06/);
  await page.reload();
  await expect(page.getByLabel("Período", { exact: true })).toHaveValue("2026-06");
  await page.goBack();
  await expect(page).toHaveURL(/period=2026-07/);
  await page.goForward();
  await expect(page).toHaveURL(/period=2026-06/);
  await page.getByRole("link", { name: "Anual", exact: true }).click();
  await expect(page).toHaveURL(/mode=annual&period=2026/);
  await expect(page.getByText("Divisor: 7", { exact: false })).toBeVisible();
  await page.goto("/reports?mode=monthly&period=2026-13");
  await expect(page.getByRole("alert").filter({ hasText: "Período inválido" })).toContainText("Período inválido");
});

test("reports remain readable on mobile with textual tables and sources", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/reports?mode=monthly&period=2026-07");
  await expect(page.getByRole("heading", { name: "Origens dos totais" })).toBeVisible();
  await page.getByText("Como calculamos", { exact: true }).click();
  await expect(page.getByText("Regime de competência:", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "reports/reports-mobile.png", fullPage: true });
});
