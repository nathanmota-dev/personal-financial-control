import { test, expect } from "./helpers/fixture";
import { saveDialog } from "./helpers/forms";

test("reserve shows composition, changes its expected rate and confirms balance", async ({
  page,
}) => {
  await page.goto("/investments/emergency-reserve");
  await expect(
    page.getByRole("heading", { name: "Reserva de emergência", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Taxa mensal esperada (%)").fill("1,00");
  await page.getByRole("button", { name: "Salvar taxa", exact: true }).click();
  await expect(
    page
      .getByText(/Taxa|taxa/)
      .filter({ hasText: /atualizada|salva/ })
      .last(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Conferir saldo real", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Conferir saldo real" });
  await dialog.getByLabel("Saldo real", { exact: true }).fill("30.000,00");
  await saveDialog(dialog, "Salvar checkpoint");
  await expect(
    page
      .getByText("Saldo estimado hoje", { exact: true })
      .locator('xpath=ancestor::*[@data-slot="card"]'),
  ).toContainText(/30\.000,00/);
});
