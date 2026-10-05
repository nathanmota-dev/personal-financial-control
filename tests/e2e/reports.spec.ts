import { test, expect } from "./helpers/fixture";

test("report URL preserves mode, navigation and explicit invalid periods", async ({ page }) => {
  await page.goto("/reports?mode=monthly&period=2026-07");
  await expect(page.getByRole("heading", { name: "Relatórios", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Período anterior", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "julho de 2026", exact: true }).click();
  await page.getByRole("button", { name: "Jun", exact: true }).click();
  await expect(page).toHaveURL(/mode=monthly&period=2026-06/);
  await page.reload();
  await expect(page.getByRole("button", { name: "junho de 2026", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/period=2026-07/);
  await page.goForward();
  await expect(page).toHaveURL(/period=2026-06/);
  await page.getByRole("tab", { name: "Anual", exact: true }).click();
  await expect(page).toHaveURL(/mode=annual&period=2026/);
  await page.getByRole("button", { name: "Selecionar ano: 2026" }).click();
  await page.getByRole("spinbutton", { name: "Ano do relatório" }).fill("2025");
  await page.getByRole("button", { name: "Consultar ano" }).click();
  await expect(page).toHaveURL(/mode=annual&period=2025/);
  await page.getByRole("tab", { name: "Mensal", exact: true }).click();
  await expect(page).toHaveURL(/mode=monthly&period=2026-06/);
  await expect(page.getByRole("button", { name: "junho de 2026", exact: true })).toBeVisible();
  await page.goto("/reports?mode=monthly&period=2026-13");
  await expect(page.getByRole("alert").filter({ hasText: "Período inválido" })).toContainText("Período inválido");
});

test("reports remain readable on mobile with textual tables and sources", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/reports?mode=monthly&period=2026-07");
  await expect(page.getByRole("heading", { name: "Meses do ano", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Categorias", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Categorias e comparação" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Meses do ano", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Origens dos totais", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Origens dos totais" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evolução mensal" })).toHaveCount(0);
  await expect(page.getByRole("article", { name: "Receitas", exact: true })).toHaveCount(0);
  await page.getByText("Como calculamos", { exact: true }).click();
  await expect(page.getByText("Regime de competência:", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "reports/reports-mobile.png", fullPage: true });
});

test("months are visible while secondary report requests are pending", async ({ page }) => {
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => { release = resolve; });
  const requested: string[] = [];
  await page.route("**/api/reports?*", async (route) => {
    const view = new URL(route.request().url()).searchParams.get("view")!;
    requested.push(view);
    if (view === "categories") await blocked;
    await route.continue();
  });
  await page.goto("/reports?mode=monthly&period=2026-07");
  await expect(page.getByRole("heading", { name: "Meses do ano", exact: true })).toBeVisible();
  await expect.poll(() => [...requested].sort()).toEqual(["categories", "sources"]);
  await page.getByRole("tab", { name: "Origens dos totais", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Origens dos totais" })).toBeVisible();
  await page.getByRole("tab", { name: "Categorias", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Carregando");
  release();
  await expect(page.getByRole("heading", { name: "Categorias e comparação" })).toBeVisible();
  await expect.poll(() => [...requested].sort()).toEqual(["categories", "sources"]);
});
