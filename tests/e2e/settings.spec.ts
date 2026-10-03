import { test, expect } from "./helpers/fixture";
import { saveDialog } from "./helpers/forms";

test("account creation, editing and archiving persist across pages", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page
    .getByRole("button", { name: "Cadastrar conta", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: "Nova conta" });
  await dialog
    .getByRole("textbox", { name: "Nome", exact: true })
    .fill("Conta E2E");
  await dialog
    .getByRole("textbox", { name: "Saldo inicial (R$)" })
    .fill("100,00");
  await saveDialog(dialog, "Criar conta");
  await page.getByRole("link", { name: "Configurações", exact: true }).click();
  let card = page.locator("[data-slot=card]").filter({ hasText: "Conta E2E" });
  await card.getByRole("button", { name: "Editar", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Editar conta" });
  await dialog
    .getByRole("textbox", { name: "Nome", exact: true })
    .fill("Conta editada E2E");
  await saveDialog(dialog, "Salvar alterações");
  card = page
    .locator("[data-slot=card]")
    .filter({ hasText: "Conta editada E2E" });
  await card.getByRole("button", { name: "Arquivar", exact: true }).click();
  await expect(card).toContainText("Arquivada");
  await page.reload();
  await expect(card).toContainText("Arquivada");
});
