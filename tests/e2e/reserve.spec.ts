import { test, expect } from "./helpers/fixture";
import { saveDialog } from "./helpers/forms";

test("manual reserve settings live in Settings and feed the reserve screen", async ({
  page,
}) => {
  await page.goto("/settings?tab=investments");
  await expect(
    page.getByRole("tab", { name: "Investimentos", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
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

  await page.goto("/reserve");
  await expect(
    page.getByRole("heading", { name: "Reserva", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Saldo estimado hoje", exact: true }),
  ).toContainText(/30\.000,00/);
  await expect(page.getByRole("button", { name: "Salvar taxa", exact: true })).toHaveCount(0);
});
