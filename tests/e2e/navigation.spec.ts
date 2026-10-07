import { test, expect } from "./helpers/fixture";

test("demo entry, month-aware navigation, search, sidebar and persisted theme", async ({
  page,
}) => {
  await page.goto("/login?next=/transactions");
  await page.getByRole("link", { name: "Explorar demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Lançamentos", exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Visão mensal" }),
  ).toBeVisible();
  const navigation = page.getByRole("navigation", {
    name: "Navegação principal",
  });
  await navigation
    .getByRole("textbox", { name: "Buscar páginas" })
    .fill("calcul");
  await expect(navigation.getByRole("link", { name: "Dashboard" })).toHaveCount(
    0,
  );
  await navigation.getByRole("link", { name: "Calculadoras" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Calculadoras financeiras",
      exact: true,
    }),
  ).toBeVisible();
  await navigation.getByRole("textbox").fill("");
  await page.getByRole("button", { name: "Recolher sidebar" }).click();
  await page.getByRole("button", { name: "Expandir sidebar" }).click();
  await page
    .getByRole("button", { name: "Abrir preferências da conta" })
    .click();
  await page.getByRole("button", { name: "Escuro", exact: true }).click();
  const theme = await page.evaluate(() => localStorage.getItem("theme"));
  expect(["dark", "light"]).toContain(theme);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(new RegExp(theme!));
});

test("mobile menu opens and reaches a financial view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /Abrir menu/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Metas", exact: true })
    .click();
  await expect(page).toHaveURL(/\/goals$/);
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Metas e planos futuros" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("dialog", { name: "Menu" })
    .getByRole("link", { name: "Investimentos", exact: true }).click();
  await expect(page).toHaveURL(/\/investments$/);
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("dialog", { name: "Menu" })
    .getByRole("link", { name: "Carteira de longo prazo", exact: true }).click();
  await expect(page).toHaveURL(/\/investments\/portfolio$/);
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  for (const [name, path] of [["Configurações", "/settings"], ["Ajuda", "/help"]]) {
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.getByRole("dialog", { name: "Menu" })
      .getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
  }
});
