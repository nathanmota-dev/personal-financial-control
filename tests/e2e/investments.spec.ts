import { test, expect } from "./helpers/fixture";

test("consolidated investment overview links to portfolio and reserve", async ({
  page,
}) => {
  await page.goto("/investments");
  await expect(
    page.getByRole("heading", { name: "Investimentos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Patrimônio investido", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Distribuição por classe" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Abrir carteira" }).click();
  await expect(
    page.getByRole("heading", { name: "Carteira de longo prazo", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Reserva de emergência", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Reserva de emergência", exact: true }),
  ).toBeVisible();
});
