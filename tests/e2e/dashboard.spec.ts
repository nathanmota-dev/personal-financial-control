import { test, expect } from "./helpers/fixture";
import { accountIds, categoryIds } from "../../lib/demo/fixture";

test("dashboard shows balances and updates confirmed income and uncategorized expenses", async ({
  page,
  request,
}) => {
  await page.goto("/dashboard?month=2026-07");
  await expect(
    page.getByRole("heading", { name: "Saldos por conta" }),
  ).toBeVisible();
  await expect(
    page.locator("article").filter({ has: page.getByText("Receitas", { exact: true }) }),
  ).toContainText(/6\.500,00/);
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
  await expect(
    page.locator("article").filter({ has: page.getByText("Receitas", { exact: true }) }),
  ).toContainText(/6\.623,45/);
  const expense = await request.post("/api/transactions", {
    data: {
      accountId: accountIds.checking,
      type: "expense",
      amountCents: 100,
      transactionDate: "2026-07-16",
      competenceMonth: "2026-07",
      description: "Organizar E2E",
    },
  });
  expect(expense.status()).toBe(201);
  await page.reload();
  await page.getByRole("link", { name: "Categorizar agora" }).click();
  await expect(page).toHaveURL(/uncategorized=true/);
  await expect(
    page.getByRole("row").filter({ hasText: "Organizar E2E" }),
  ).toContainText("Sem categoria");
});

test("dashboard changes competence while keeping the current consolidated portfolio", async ({ page }) => {
  await page.goto("/dashboard?month=2026-07");
  const portfolio = page.locator("section").filter({ has: page.getByRole("heading", { name: "Carteira consolidada" }) });
  await expect(portfolio).toContainText(/R\$\s*\d/);
  const currentPortfolio = await portfolio.innerText();
  await expect(page.getByText("Fatura de julho de 2026", { exact: false })).toBeVisible();
  await expect(page.getByRole("article", { name: "Receitas" })).toContainText("em relação ao mês anterior");
  await page.getByRole("button", { name: /Selecionar mês/ }).click();
  await page.getByRole("button", { name: "Jun", exact: true }).click();
  await expect(page).toHaveURL(/month=2026-06/);
  await expect(page.getByRole("button", { name: /Selecionar mês:.*junho/ })).toBeVisible();
  await expect(page.getByText("Fatura de junho de 2026", { exact: false })).toBeVisible();
  await expect(portfolio).toHaveText(currentPortfolio, { useInnerText: true });
  await expect(page.getByText("Variação do saldo no mês")).toBeVisible();
});

test("wide dashboard fits the metrics and first chart row without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto("/dashboard?month=2026-06");
  await expect(page.getByRole("button", { name: "Ocultar valores", exact: true })).toBeVisible();
  for (const name of ["Evolução mensal", "Gastos por categoria", "Distribuição das despesas"]) {
    const card = page.locator("section").filter({ has: page.getByRole("heading", { name, exact: true }) });
    await expect(card).toBeVisible();
    await expect.poll(async () => {
      const bounds = await card.boundingBox();
      return bounds !== null && bounds.y >= 0 && bounds.y + bounds.height <= 1000;
    }).toBe(true);
  }
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({ path: "reports/dashboard-wide.png" });
});
