import { test, expect } from "./helpers/fixture";

test("calculator catalog, calculation, units, table, persistence and clearing", async ({
  page,
}) => {
  await page.goto("/calculators");
  await page.getByRole("link", { name: /Juros compostos/ }).click();
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Preencha todos" }),
  ).toBeVisible();
  await page.getByLabel("Valor inicial").fill("1.000,00");
  await page.getByLabel("Valor mensal").fill("100,00");
  await page.getByLabel("Taxa de juros").fill("0");
  await page.getByLabel("Período", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: "Valor total final" }),
  ).toContainText(/2\.200,00/);
  await page.getByRole("tab", { name: "Tabela" }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(14);
  await page.reload();
  await expect(page.getByLabel("Valor inicial")).toHaveValue("1.000,00");
  const selects = page.getByRole("main").getByRole("combobox");
  await selects.nth(0).click();
  await page.getByRole("option", { name: "mensal" }).click();
  await selects.nth(1).click();
  await page.getByRole("option", { name: "meses" }).click();
  await page.getByLabel("Taxa de juros").fill("1");
  await page.getByLabel("Período", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(
    page.locator('[data-slot="card"]').filter({ hasText: "Valor total final" }),
  ).toContainText(/1\.221,10/);
  await page.getByRole("button", { name: "Limpar", exact: true }).click();
  await expect(page.getByLabel("Valor inicial")).toHaveValue("");
  await expect(
    page.getByText("Valor total final", { exact: true }),
  ).toHaveCount(0);
});
