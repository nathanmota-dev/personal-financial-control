import { test, expect } from "./helpers/fixture";
import { saveDialog } from "./helpers/forms";

test("creates and edits installment purchases and verifies future invoices", async ({
  page,
  request,
}) => {
  await page.goto("/credit-card?month=2026-07");
  await page.getByRole("button", { name: "Nova compra", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nova compra no cartão" });
  await dialog.getByRole("textbox", { name: "Valor total (R$)" }).fill("90,00");
  await dialog.getByRole("spinbutton", { name: "Parcelas" }).fill("3");
  await dialog
    .getByRole("textbox", { name: "Descrição da compra" })
    .fill("Compra parcelada E2E");
  await saveDialog(dialog, "Criar compra");
  await expect(
    page
      .getByText("Compra parcelada E2E", { exact: true })
      .locator("xpath=ancestor::article"),
  ).toContainText(/30,00/);
  const charges = (await (await request.get("/api/credit-card/charges")).json())
    .charges;
  const charge = charges.find(
    (item: { description: string }) =>
      item.description === "Compra parcelada E2E",
  );
  expect(charge).toMatchObject({ totalAmountCents: 9000, installmentCount: 3 });
  await page.goto("/credit-card?month=2026-08");
  await expect(
    page
      .getByText("Compra parcelada E2E", { exact: true })
      .locator("xpath=ancestor::article"),
  ).toContainText(/30,00/);
  const removed = await request.delete(`/api/credit-card/charges/${charge.id}`);
  expect(removed.status()).toBe(204);
  await page.reload();
  await expect(
    page.getByText("Compra parcelada E2E", { exact: true }),
  ).toHaveCount(0);
});
