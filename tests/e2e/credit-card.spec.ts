import { test as base } from "@playwright/test";
import { test, expect } from "./helpers/fixture";
import { saveDialog } from "./helpers/forms";
import { loginWithPin } from "./helpers/local-auth";
import { startFinanceServer } from "./helpers/server";
import type { FinanceServer } from "./helpers/contracts";

// Open Finance is unavailable in demo mode, so this flow needs an authenticated server.
const authenticatedTest = base.extend<{ finance: FinanceServer }>({
  finance: [async ({}, deliver) => {
    const server = await startFinanceServer(true);
    try { await deliver(server); } finally { await server.close(); }
  }, { timeout: 60000 }],
});
authenticatedTest.use({ locale: "pt-BR" });

function monthFromNow(delta: number) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + delta, 1)).toISOString().slice(0, 7);
}

authenticatedTest("shows a stubbed Open Finance purchase in the correct invoices", async ({ page, context, finance }) => {
  await loginWithPin(context, finance.url);
  const created = await context.request.post(`${finance.url}/api/accounts`, { headers: { Origin: finance.url }, data: { name: "Cartão local E2E", type: "credit", initialBalanceCents: 0, creditClosingDay: 5, creditDueDay: 12 } });
  expect(created.status()).toBeLessThan(300);
  await page.goto(`${finance.url}/settings`);
  await page.getByRole("dialog").getByRole("button", { name: "Pular configuração", exact: true }).click();
  await page.goto(`${finance.url}/settings`);
  await page.getByRole("tab", { name: "Open Finance", exact: true }).click();
  await page.getByLabel("Nome do banco").fill("Banco Cartão E2E");
  await page.getByLabel("Item ID").fill("99999999-2222-3333-4444-555555555555");
  await page.getByRole("button", { name: "Adicionar conexão", exact: true }).click();
  await page.getByLabel("Conta local de Cartão remoto").selectOption({ label: "Cartão local E2E" });
  await page.getByRole("button", { name: "Vincular conta", exact: true }).click();
  await expect(page.getByText("Vinculada", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sincronizar bancos", exact: true }).click();
  await expect(page.getByRole("status", { name: "Última sincronização" })).toContainText("1 compras no cartão");

  for (const delta of [0, 1, 2]) {
    await page.goto(`${finance.url}/credit-card?month=${monthFromNow(delta)}`);
    await expect(page.getByText("COMPRA CARTAO E2E", { exact: true }).locator("xpath=ancestor::article")).toContainText(/30,00/);
  }
  await page.goto(`${finance.url}/credit-card?month=${monthFromNow(3)}`);
  await expect(page.getByText("COMPRA CARTAO E2E", { exact: true })).toHaveCount(0);
});

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
  await expect(page.getByRole("region", { name: "Resumo da fatura" }))
    .toContainText("Estimativa para 08/2026");
  const commitments = page.getByRole("complementary").filter({ has: page.getByRole("heading", { name: "Próximas faturas" }) });
  await expect(commitments.getByText("Ago. de 26", { exact: true })).toBeVisible();
  await expect(commitments.getByText("Set. de 26", { exact: true })).toBeVisible();
  await expect(commitments.getByText("Out. de 26", { exact: true })).toBeVisible();
  await expect(commitments.getByText("Mai. de 25", { exact: true })).toHaveCount(0);
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
