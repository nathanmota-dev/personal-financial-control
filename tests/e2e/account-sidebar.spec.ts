import { test, expect } from "./helpers/fixture";

test("collapsed sidebar keeps navigation and account returns to the previous month", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/dashboard?month=2026-08");
  await page.getByRole("button", { name: "Recolher sidebar" }).click();
  const sidebar = page.locator("aside");
  for (const name of ["Dashboard", "Lançamentos", "Cartão", "Orçamentos", "Recorrentes", "Saldo Projetado", "Investimentos", "Relatórios", "Metas", "Calculadoras", "Configurações", "Ajuda"]) {
    const link = sidebar.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link.locator("svg")).toBeVisible();
  }
  await sidebar.getByRole("link", { name: "Lançamentos", exact: true }).click();
  await expect(page).toHaveURL(/\/transactions\?month=2026-08$/);
  await sidebar.getByRole("button", { name: "Abrir preferências da conta" }).click();
  await page.getByRole("link", { name: "Minha conta", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Minha conta" })).toBeVisible();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Visitante");
  await expect(page.getByLabel("Sobrenome")).toHaveValue("demo");
  await expect(page.getByLabel("E-mail")).toHaveAttribute("readonly", "");
  await page.screenshot({ path: "reports/account-sidebar-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page).toHaveURL(/\/transactions\?month=2026-08$/);
  await page.getByRole("button", { name: "Expandir sidebar" }).click();
  await sidebar.getByRole("button", { name: "Abrir preferências da conta" }).click();
  await page.getByRole("link", { name: "Minha conta", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await page.screenshot({ path: "reports/account-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page).toHaveURL(/\/transactions\?month=2026-08$/);
});
