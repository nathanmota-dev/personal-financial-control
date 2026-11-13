import { test, expect } from "./helpers/fixture";

test("consolidated investment overview links to portfolio and reserve", async ({
  page,
}) => {
  await page.goto("/investments");
  await expect(
    page.getByRole("heading", { name: "Investimentos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Patrimônio investido", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Distribuição por classe" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Abrir carteira" }).click();
  await expect(
    page.getByRole("heading", { name: "Carteira", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Reserva", exact: true })
    .click();
  await expect(page).toHaveURL(/\/reserve$/);
  await expect(
    page.getByRole("heading", { name: "Reserva", exact: true }),
  ).toBeVisible();
});
