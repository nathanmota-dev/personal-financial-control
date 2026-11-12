import { test, expect } from "./helpers/fixture";
import { accountIds, categoryIds } from "../../lib/demo/fixture";

test("dashboard shows the forecast and updates confirmed income", async ({
  page,
  request,
}) => {
  await page.goto("/dashboard?month=2026-07");
  await expect(
    page.getByRole("heading", { name: "Saldo previsto" }),
  ).toBeVisible();
  const income = page.locator("dl > div").filter({ has: page.getByText("Receitas", { exact: true }) });
  await expect(income).toContainText("15.000,00");
  const response = await request.post("/api/transactions", {
    data: {
      accountId: accountIds.checking,
      categoryId: categoryIds.salary,
      type: "income",
      amountCents: 12345,
      transactionDate: "2026-07-16",
      competenceMonth: "2026-07",
      description: "Receita E2E",
    },
  });
  expect(response.status()).toBe(201);
  await page.reload();
  await expect(income).toContainText("15.123,45");
});

test("dashboard changes competence while keeping the current consolidated portfolio", async ({ page }) => {
  await page.goto("/dashboard?month=2026-07");
  const portfolio = page.locator("section").filter({ has: page.getByRole("heading", { name: "Investimentos", exact: true }) });
  await expect(portfolio).toContainText(/R\$\s*\d/);
  const currentPortfolio = await portfolio.innerText();
  await expect(page.getByText("Fatura de julho", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "julho de 2026" }).click();
  await page.getByRole("button", { name: "Jun", exact: true }).click();
  await expect(page).toHaveURL(/month=2026-06/);
  await expect(page.getByRole("button", { name: "junho de 2026" })).toBeVisible();
  await expect(page.getByText("Fatura de junho", { exact: false })).toBeVisible();
  await expect(portfolio).toHaveText(currentPortfolio, { useInnerText: true });
  await expect(page.getByText("Variação do saldo no mês")).toBeVisible();
});

test("category distribution tooltip follows the hovered segment outside the donut center", async ({ page }) => {
  await page.goto("/dashboard?month=2026-07");
  const card = page
    .getByRole("heading", { name: "Distribuição das despesas" })
    .locator("xpath=ancestor::section[1]");
  const chart = card.locator('[data-slot="chart"]').first();
  await card.scrollIntoViewIfNeeded();
  await expect(chart).toBeVisible();
  await expect(chart.locator(".recharts-sector").first()).toBeVisible();
  const chartBounds = await chart.boundingBox();
  expect(chartBounds).not.toBeNull();
  if (!chartBounds) return;

  const centerX = chartBounds.x + chartBounds.width / 2;
  const centerY = chartBounds.y + chartBounds.height / 2;
  const chartLayout = chart.locator("xpath=..");
  const centerText = chartLayout
    .locator(".pointer-events-none.absolute.inset-0 > span");
  const labelBounds = await centerText.nth(0).boundingBox();
  const amountBounds = await centerText.nth(1).boundingBox();
  expect(labelBounds).not.toBeNull();
  expect(amountBounds).not.toBeNull();

  const tooltip = chartLayout.getByTestId("dashboard-category-tooltip");
  const lowerX = centerX + chartBounds.width * 0.25;
  const lowerY = centerY + chartBounds.height * 0.25;
  await page.mouse.move(lowerX, lowerY);
  await expect(tooltip).toBeVisible();
  const lowerTooltipBounds = await tooltip.boundingBox();
  expect(lowerTooltipBounds).not.toBeNull();
  if (!lowerTooltipBounds || !labelBounds || !amountBounds) return;
  expect(lowerTooltipBounds.y).toBeGreaterThan(lowerY);
  expect(lowerTooltipBounds.x).toBeGreaterThan(lowerX);
  expect(lowerTooltipBounds.x - lowerX).toBeLessThan(24);
  expect(lowerTooltipBounds.y - lowerY).toBeLessThan(24);
  expect(Math.hypot(lowerTooltipBounds.x - centerX, lowerTooltipBounds.y - centerY)).toBeGreaterThan(chartBounds.width * 0.44);
  expect(
    lowerTooltipBounds.x + lowerTooltipBounds.width <= labelBounds.x ||
      lowerTooltipBounds.x >= labelBounds.x + labelBounds.width ||
      lowerTooltipBounds.y + lowerTooltipBounds.height <= labelBounds.y ||
      lowerTooltipBounds.y >= labelBounds.y + labelBounds.height,
  ).toBe(true);
  expect(
    lowerTooltipBounds.x + lowerTooltipBounds.width <= amountBounds.x ||
      lowerTooltipBounds.x >= amountBounds.x + amountBounds.width ||
      lowerTooltipBounds.y + lowerTooltipBounds.height <= amountBounds.y ||
      lowerTooltipBounds.y >= amountBounds.y + amountBounds.height,
  ).toBe(true);
});

test("wide dashboard fits the forecast and bills row without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto("/dashboard?month=2026-06");
  await expect(page.getByRole("button", { name: "Ocultar valores", exact: true })).toBeVisible();
  for (const name of ["Saldo previsto", "Contas a pagar"]) {
    const card = page.locator("section").filter({ has: page.getByRole("heading", { name }) }).first();
    await expect(card).toBeVisible();
    await expect.poll(async () => {
      const bounds = await card.boundingBox();
      return bounds !== null && bounds.y >= 0 && bounds.y + bounds.height <= 1000;
    }).toBe(true);
  }
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({ path: "reports/dashboard-wide.png" });
});

test("account preferences and month picker follow the selected theme", async ({ page }) => {
  await page.goto("/dashboard?month=2026-07");
  const account = page.getByRole("group", { name: "Conta e preferências" });
  await expect(account.getByRole("button", { name: "Ocultar valores" })).toBeVisible();
  for (const theme of ["Claro", "Escuro", "Auto"]) {
    await account.getByRole("button", { name: "Abrir preferências da conta" }).click();
    const preferences = page.getByRole("dialog");
    await expect(preferences.getByRole("link", { name: "Minha conta" })).toHaveAttribute("href", "/account");
    await expect(preferences.getByRole("group", { name: "Idioma" })).toBeVisible();
    await expect(preferences.getByRole("button", { name: /Buscar/ })).toHaveAttribute("aria-disabled", "true");
    await preferences.getByRole("button", { name: theme, exact: true }).click();
    await expect(preferences.getByRole("button", { name: theme, exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.screenshot({ animations: "disabled", path: `reports/account-${theme}.png` });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "julho de 2026", exact: true }).click();
    const selected = page.getByRole("button", { name: "Jul", exact: true });
    await expect(selected).toHaveAttribute("aria-pressed", "true");
    const colors = await selected.evaluate(element => {
      const style = getComputedStyle(element);
      return { text: style.color, background: style.backgroundColor };
    });
    expect(colors.text).not.toBe(colors.background);
    await page.screenshot({ animations: "disabled", path: `reports/month-picker-${theme}.png` });
    await page.keyboard.press("Escape");
  }
});
