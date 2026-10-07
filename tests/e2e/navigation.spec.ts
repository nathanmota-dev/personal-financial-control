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

test("mobile command button searches accents and aliases", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  const trigger = page.getByRole("button", { name: /Abrir paleta de comandos/ });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const palette = page.getByRole("dialog", { name: "Menu de comandos" });
  const search = palette.getByRole("combobox", {
    name: "Buscar página ou ação",
  });
  await search.fill("reserva");
  await expect(
    palette.getByRole("option", { name: /Reserva de emergência/ }),
  ).toBeVisible();
  await palette
    .getByRole("option", { name: /Reserva de emergência/ })
    .click();
  await expect(page).toHaveURL(/\/investments\/emergency-reserve$/);

  await trigger.click();
  const reopenedPalette = page.getByRole("dialog", {
    name: "Menu de comandos",
  });
  const reopenedSearch = reopenedPalette.getByRole("combobox", {
    name: "Buscar página ou ação",
  });
  await reopenedSearch.fill("CARTAO");
  await expect(
    reopenedPalette.getByRole("option", { name: /^Cartão/ }),
  ).toBeVisible();
});

test("command action opens a month-aware expense form once", async ({ page }) => {
  await page.goto("/dashboard?month=2026-08");
  await page.getByRole("button", { name: "Recolher sidebar" }).click();
  await expect(
    page.getByRole("button", { name: /Abrir paleta de comandos/ }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");

  const palette = page.getByRole("dialog", { name: "Menu de comandos" });
  await palette
    .getByRole("combobox", { name: "Buscar página ou ação" })
    .fill("lancamento");
  await palette.getByRole("option", { name: /^Nova despesa/ }).click();

  await expect(page).toHaveURL(/\/transactions\?month=2026-08$/);
  const form = page.getByRole("dialog", { name: "Novo lançamento" });
  await expect(form).toBeVisible();
  await expect(form.locator('input[name="competenceMonth"]')).toHaveValue(
    "2026-08",
  );
  await expect(form.getByRole("combobox", { name: "Tipo" })).toHaveText(
    "Despesa",
  );
  await expect(form.getByRole("textbox", { name: "Descrição" })).toBeEmpty();

  await page.keyboard.press("Escape");
  await expect(form).toBeHidden();
  await expect(page).not.toHaveURL(/command=/);
  await page.reload();
  await expect(form).toBeHidden();
  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard\?month=2026-08$/);
  await expect(page.getByRole("dialog", { name: "Novo lançamento" })).toBeHidden();
});
