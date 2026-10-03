import { test, expect } from "./helpers/fixture";
import { saveDialog } from "./helpers/forms";

test("asset detail records a fixed-income operation and a manual valuation", async ({
  page,
}) => {
  await page.goto("/investments/portfolio");
  await page.getByRole("button", { name: "Cadastrar ativo" }).click();
  const dialog = page.getByRole("dialog", { name: "Novo ativo" });
  await dialog
    .getByRole("textbox", { name: "Nome", exact: true })
    .fill("CDB Operacional E2E");
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "CDB", exact: true }).click();
  await saveDialog(dialog, "Criar ativo");
  await page.getByRole("link", { name: /CDB Operacional E2E/ }).click();
  await page.getByRole("button", { name: "Operação", exact: true }).click();
  const operation = page.getByRole("dialog", { name: "Registrar operação" });
  await operation
    .getByRole("textbox", { name: "Valor bruto", exact: true })
    .fill("100,00");
  await saveDialog(operation, "Salvar operação");
  await expect(page.getByText("Aplicação", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Saldo", exact: true }).click();
  const valuation = page.getByRole("dialog", { name: "Atualizar valoração" });
  await valuation
    .getByRole("textbox", { name: "Valor em reais" })
    .fill("110,00");
  await saveDialog(valuation);
  await expect(
    page.getByText("Valor atual", { exact: true }).locator(".."),
  ).toContainText(/110,00/);
});

test("an unknown investment asset returns not found", async ({ page }) => {
  const response = await page.goto(
    "/investments/assets/00000000-0000-4000-8000-000000000099",
  );
  // Next.js streams the notFound boundary with HTTP 200 after loading starts.
  expect(response?.ok()).toBe(true);
  await expect(
    page.locator('meta[name="robots"][content="noindex"]').first(),
  ).toHaveAttribute("content", "noindex");
  await expect(
    page.getByText(/could not be found|não encontrad/i),
  ).toBeVisible();
});
