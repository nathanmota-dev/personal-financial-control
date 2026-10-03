import { test, expect } from "./helpers/fixture";
import { saveDialog } from "./helpers/forms";

test("projection periods, table, daily detail and isolated purchase simulations", async ({
  page,
  request,
}) => {
  await page.goto(
    "/projected-balance?period=next_30_days&startDate=2026-07-16",
  );
  await expect(
    page.getByRole("heading", { name: "Saldo projetado", exact: true }),
  ).toBeVisible();
  const before = (await (await request.get("/api/transactions")).json())
    .transactions.length;
  await page
    .getByRole("button", { name: "Simular compra", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Simular compra",
    exact: true,
  });
  await dialog
    .getByRole("textbox", { name: "Descrição", exact: true })
    .fill("Notebook simulado E2E");
  await dialog
    .getByRole("textbox", { name: "Valor", exact: true })
    .fill("100,00");
  await saveDialog(dialog, "Aplicar à projeção");
  await expect(
    page.getByText("1 compra simulada", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Tabela" }).click();
  await expect(page.getByRole("table").getByRole("button")).toHaveCount(30);
  await page.getByRole("tab", { name: "Calendário" }).click();
  await page.getByRole("button", { name: /^16\/07\/2026\./ }).click();
  await expect(page.getByRole("dialog")).toContainText("Notebook simulado E2E");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Fechar|Close/ })
    .click();
  await page
    .getByRole("button", { name: "Remover simulação Notebook simulado E2E" })
    .click();
  await expect(page.getByText(/Nenhuma simulação ativa/)).toBeVisible();
  expect(
    (await (await request.get("/api/transactions")).json()).transactions,
  ).toHaveLength(before);
});
