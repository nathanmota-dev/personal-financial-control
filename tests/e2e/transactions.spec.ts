import { test, expect } from "./helpers/fixture";
import { choose, saveDialog } from "./helpers/forms";

test("create, edit, delete an expense and persist after reload", async ({
  page,
}) => {
  await page.goto("/transactions?month=2026-07");
  await page
    .getByRole("button", { name: "Novo lançamento", exact: true })
    .click();
  let dialog = page.getByRole("dialog", {
    name: "Novo lançamento",
    exact: true,
  });
  await dialog
    .getByRole("textbox", { name: "Valor", exact: true })
    .fill("12,34");
  await dialog
    .getByRole("textbox", { name: "Descrição", exact: true })
    .fill("Compra E2E");
  await saveDialog(dialog, "Criar lançamento");
  let row = page.getByRole("row").filter({ hasText: "Compra E2E" });
  await expect(row).toContainText(/12,34/);
  await page.reload();
  await row.getByRole("button", { name: "Editar lançamento" }).click();
  dialog = page.getByRole("dialog", { name: "Editar lançamento", exact: true });
  await dialog
    .getByRole("textbox", { name: "Descrição", exact: true })
    .fill("Compra revisada E2E");
  await dialog
    .getByRole("textbox", { name: "Valor", exact: true })
    .fill("56,78");
  await choose(dialog, "Status", "Pendente");
  await saveDialog(dialog, "Salvar alterações");
  row = page.getByRole("row").filter({ hasText: "Compra revisada E2E" });
  await expect(row).toContainText("Pendente");
  await expect(row).toContainText(/56,78/);
  await row.getByRole("button", { name: "Excluir lançamento" }).click();
  await saveDialog(
    page.getByRole("dialog", { name: "Excluir lançamento" }),
    "Excluir",
  );
  await expect(row).toHaveCount(0);
  await page.reload();
  await expect(row).toHaveCount(0);
});

test("income and investment contribution respect category and account selections", async ({
  page,
}) => {
  await page.goto("/transactions?month=2026-07");
  for (const [type, category] of [
    ["Receita", "Salário"],
    ["Aporte", "Investimentos"],
  ]) {
    await page
      .getByRole("button", { name: "Novo lançamento", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Novo lançamento",
      exact: true,
    });
    await choose(dialog, "Tipo", type);
    await dialog.getByRole("combobox", { name: "Conta", exact: true }).click();
    await page.getByRole("option", { name: /Nubank/ }).click();
    await choose(dialog, "Categoria", category);
    await dialog
      .getByRole("textbox", { name: "Valor", exact: true })
      .fill("100,00");
    await dialog
      .getByRole("textbox", { name: "Descrição", exact: true })
      .fill(`${type} E2E`);
    await saveDialog(dialog, "Criar lançamento");
    await expect(
      page.getByRole("row").filter({ hasText: `${type} E2E` }),
    ).toContainText(category);
  }
});
