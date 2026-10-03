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
    page.getByText("Entradas confirmadas no mês").locator(".."),
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
    page.getByText("Entradas confirmadas no mês").locator(".."),
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
