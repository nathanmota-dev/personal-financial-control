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
  const projectionDay = page.getByRole("button", { name: /^16\/07\/2026\./ });
  const originalDayLabel = await projectionDay.getAttribute("aria-label");
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
  await expect(dialog).not.toBeVisible();
  await expect(projectionDay).not.toHaveAttribute("aria-label", originalDayLabel!);
  await page.getByRole("tab", { name: "Tabela" }).click();
  await expect(page.getByRole("table").getByRole("button")).toHaveCount(30);
  await page.getByRole("tab", { name: "Calendário" }).click();
  await projectionDay.click();
  await expect(page.getByRole("dialog")).toContainText("Notebook simulado E2E");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Remover simulação Notebook simulado E2E" })
    .click();
  await expect(page.getByRole("dialog")).not.toContainText("Notebook simulado E2E");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Fechar|Close/ })
    .click();
  await expect(projectionDay).toHaveAttribute("aria-label", originalDayLabel!);
  expect(
    (await (await request.get("/api/transactions")).json()).transactions,
  ).toHaveLength(before);
});
