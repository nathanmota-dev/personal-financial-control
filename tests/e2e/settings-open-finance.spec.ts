import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";
import { startFinanceServer } from "./helpers/server";
import { loginWithPin } from "./helpers/local-auth";
import type { FinanceServer } from "./helpers/contracts";

// Open Finance is unavailable in demo mode, so this flow needs an authenticated server.
const test = base.extend<{ finance: FinanceServer }>({
  finance: [async ({}, deliver) => {
    const server = await startFinanceServer(true);
    try { await deliver(server); } finally { await server.close(); }
  }, { timeout: 60000 }],
});
test.use({ locale: "pt-BR" });

async function connectAndSync(page: Page, context: BrowserContext, finance: FinanceServer) {
  await loginWithPin(context, finance.url);
  const created = await context.request.post(`${finance.url}/api/accounts`, { headers: { Origin: finance.url }, data: { name: "Conta local E2E", type: "checking", initialBalanceCents: 0 } });
  expect(created.status()).toBeLessThan(300);
  await page.goto(`${finance.url}/settings`);
  await page.getByRole("dialog").getByRole("button", { name: "Pular configuração", exact: true }).click();
  await page.goto(`${finance.url}/settings`);
  await page.getByRole("tab", { name: "Open Finance", exact: true }).click();
  await page.getByLabel("Nome do banco").fill("Banco E2E");
  await page.getByLabel("Item ID").fill("11111111-2222-3333-4444-555555555555");
  await page.getByRole("button", { name: "Adicionar conexão", exact: true }).click();
  await expect(page.getByText("Conta remota", { exact: true })).toBeVisible();
  await page.getByLabel("Conta local de Conta remota").selectOption({ label: "Conta local E2E" });
  await page.getByRole("button", { name: "Vincular conta", exact: true }).click();
  await expect(page.getByText("Vinculada", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sincronizar bancos", exact: true }).click();
  const result = page.getByRole("status", { name: "Última sincronização" });
  await expect(result).toContainText("Concluída");
  await expect(result).toContainText("1 conexões · 1 contas · 0 falhas");
}

const openFinanceTab = async (page: Page, finance: FinanceServer) => {
  await page.goto(`${finance.url}/settings`);
  await page.getByRole("tab", { name: "Open Finance", exact: true }).click();
};

test("adds a connection, links an account and records a sync with Pluggy stubbed", async ({ page, context, finance }) => {
  await connectAndSync(page, context, finance);
  const result = page.getByRole("status", { name: "Última sincronização" });
  await expect(result).toContainText("3 lançamentos comuns · 1 pagamentos de fatura");
  await page.reload();
  await page.getByRole("tab", { name: "Open Finance", exact: true }).click();
  await expect(page.getByRole("status", { name: "Última sincronização" })).toContainText("Concluída");
  await expect(page.getByLabel("Conta local de Conta remota")).toHaveValue(/.+/);
  const month = new Date().toISOString().slice(0, 7);
  await page.goto(`${finance.url}/transactions?month=${month}`);
  await expect(page.getByText("Mercado E2E").first()).toBeVisible();
  await expect(page.getByText("Salário E2E").first()).toBeVisible();
  await expect(page.getByText("PAGAMENTO FATURA E2E")).toHaveCount(0);
  await expect(page.getByText("R$ 1.000,00").first()).toBeVisible();
  await expect(page.getByText("R$ 45,90").first()).toBeVisible();
  expect(finance.logs()).not.toMatch(/e2e-secret|e2e-api-key/);
});

test("categorizes a pending description and updates the matching rows and report totals", async ({ page, context, finance }) => {
  await connectAndSync(page, context, finance);
  const month = new Date().toISOString().slice(0, 7);
  const groupCards = () => page.getByRole("region", { name: "Totais por grupo de despesa" });
  await page.goto(`${finance.url}/reports?mode=monthly&period=${month}`);
  await expect(groupCards()).toContainText(/Gastos variáveis.*0,00/);
  await expect(page.getByRole("region", { name: "Sem classificação", exact: true })).toContainText("100,00");

  await openFinanceTab(page, finance);
  const select = page.getByLabel("Categoria de MERCADO E2E", { exact: true });
  await expect(page.getByText(/Despesa · 2 lançamentos/)).toContainText("R$ 100,00");
  await select.selectOption({ label: "Alimentação" });
  await expect(select).toHaveCount(0);
  await expect(page.getByLabel("Categoria de SALARIO E2E", { exact: true })).toBeVisible();

  await page.goto(`${finance.url}/transactions?month=${month}&uncategorized=true`);
  await expect(page.getByText("Salário E2E").first()).toBeVisible();
  await expect(page.getByText("Mercado E2E")).toHaveCount(0);
  await expect(page.getByText("MERCADO E2E PARC 02/03")).toHaveCount(0);

  await page.goto(`${finance.url}/transactions?month=${month}`);
  await expect(page.getByText("Mercado E2E").first()).toBeVisible();
  await expect(page.getByText("MERCADO E2E PARC 02/03").first()).toBeVisible();
  await expect(page.getByText("Alimentação").first()).toBeVisible();

  await page.goto(`${finance.url}/reports?mode=monthly&period=${month}`);
  await expect(groupCards()).toContainText(/Gastos variáveis.*100,00/);
  await expect(page.getByRole("region", { name: "Sem classificação", exact: true })).toHaveCount(0);
});
