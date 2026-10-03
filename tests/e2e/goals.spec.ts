import { test, expect } from "./helpers/fixture";
import { saveDialog } from "./helpers/forms";

test("creates, allocates, edits and archives a goal", async ({ page }) => {
  await page.goto("/goals");
  await page.getByRole("button", { name: "Nova meta", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Nova meta", exact: true });
  await dialog
    .getByRole("textbox", { name: "Nome", exact: true })
    .fill("Viagem E2E");
  await dialog
    .getByRole("textbox", { name: "Valor alvo", exact: true })
    .fill("1.000,00");
  await dialog.getByRole("button", { name: /Criar meta|Salvar meta/ }).click();
  await expect(dialog).toBeHidden();
  const card = page
    .locator("[data-slot=card]")
    .filter({
      has: page.getByRole("heading", { name: "Viagem E2E", exact: true }),
    });
  await card.getByRole("button", { name: /Alocar/ }).click();
  dialog = page.getByRole("dialog", { name: /Alocar/ });
  await dialog
    .getByRole("textbox", { name: "Valor", exact: true })
    .fill("100,00");
  await saveDialog(dialog, "Alocar");
  await expect(card).toContainText(/100,00/);
  await page
    .getByRole("button", { name: "Mais ações para Viagem E2E" })
    .click();
  await page.getByRole("menuitem", { name: "Arquivar meta" }).click();
  await saveDialog(
    page.getByRole("dialog", { name: "Arquivar meta" }),
    "Arquivar",
  );
  await expect(card).toHaveCount(0);
  await page.getByRole("tab", { name: /Arquivadas/ }).click();
  await expect(page.getByText("Viagem E2E", { exact: true })).toBeVisible();
});
