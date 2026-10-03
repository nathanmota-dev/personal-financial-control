import { test, expect } from "./helpers/fixture";
import { choose, saveDialog } from "./helpers/forms";

test("creates, pauses and removes a recurrence and avoids duplicate generation", async ({
  page,
  request,
}) => {
  await page.goto("/recurring?month=2026-07");
  await page
    .getByRole("button", { name: "Nova recorrência", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Nova recorrência",
    exact: true,
  });
  await dialog
    .getByRole("textbox", { name: "Nome da recorrência" })
    .fill("Assinatura E2E");
  await choose(dialog, "Tipo de recorrência", "Despesa");
  await dialog.getByRole("textbox", { name: /Valor/ }).fill("10,00");
  await saveDialog(dialog, "Criar recorrência");
  const card = page
    .getByRole("heading", { name: "Assinatura E2E", exact: true })
    .locator('xpath=ancestor::*[@data-slot="card"][1]');
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(card).toContainText("Pausada");
  const before = (
    await (
      await request.get("/api/transactions?competenceMonth=2026-07")
    ).json()
  ).transactions.length;
  await page.reload();
  await page.goto("/dashboard");
  await page.reload();
  expect(
    (
      await (
        await request.get("/api/transactions?competenceMonth=2026-07")
      ).json()
    ).transactions,
  ).toHaveLength(before);
  await page.goto("/recurring?month=2026-07");
  await card.getByRole("button", { name: "Excluir", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Excluir recorrência?" })
    .getByRole("button", { name: /Manter histórico/ })
    .click();
  await expect(card).toHaveCount(0);
});
