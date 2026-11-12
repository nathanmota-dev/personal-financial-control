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
  locale: "pt-BR",
});

authenticatedTest("a stubbed Pluggy sync updates a linked holding's value", async ({ page, context, finance }) => {
  await loginWithPin(context, finance.url);
  await page.goto(`${finance.url}/settings`);
  await page.getByRole("dialog").getByRole("button", { name: "Pular configuração", exact: true }).click();

  await page.goto(`${finance.url}/investments/portfolio`);
  await page.getByRole("button", { name: "Cadastrar ativo" }).click();
  const dialog = page.getByRole("dialog", { name: "Novo ativo" });
  await dialog.getByRole("textbox", { name: "Nome", exact: true }).fill("CDB E2E");
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "CDB", exact: true }).click();
  await saveDialog(dialog, "Criar ativo");
  await expect(page.getByRole("link", { name: /CDB E2E/ })).toBeVisible();

  await page.goto(`${finance.url}/settings`);
  await page.getByRole("tab", { name: "Open Finance", exact: true }).click();
  await page.getByLabel("Nome do banco").fill("Corretora E2E");
  await page.getByLabel("Item ID").fill("77777777-2222-3333-4444-555555555555");
  await page.getByRole("button", { name: "Adicionar conexão", exact: true }).click();
  const select = page.getByLabel("Ativo local de CDB E2E", { exact: true });
  await expect(select).not.toContainText("Selecione um ativo");
  await expect(page.getByText("Sugestão", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Vincular ativo", exact: true }).click();
  await expect(page.getByText("Vinculado", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Sincronizar bancos", exact: true }).click();
  await expect(page.getByRole("status", { name: "Última sincronização" })).toContainText("1 investimentos atualizados");

  await page.goto(`${finance.url}/investments/portfolio`);
  await expect(page.getByRole("link", { name: /CDB E2E/ })).toBeVisible();
  await expect(page.getByText("R$ 1.234,56").first()).toBeVisible();
});

test("registers all supported asset types and filters positions", async ({
  page,
}) => {
  await page.goto("/investments/portfolio");
  for (const type of ["Ação", "FII", "ETF", "Tesouro", "CDB", "LCI", "LCA"]) {
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    const dialog = page.getByRole("dialog", { name: "Novo ativo" });
    await dialog
      .getByRole("textbox", { name: "Nome", exact: true })
      .fill(`Ativo ${type} E2E`);
    await dialog
      .getByRole("textbox", { name: "Código", exact: true })
      .fill(
        type === "Ação"
          ? "PETR4"
          : type === "FII"
            ? "HGLG11"
            : type === "ETF"
              ? "BOVA11"
              : "",
      );
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: type, exact: true }).click();
    await saveDialog(dialog, "Criar ativo");
    await expect(
      page.getByRole("link", { name: new RegExp(`Ativo ${type} E2E`) }),
    ).toBeVisible();
  }
  await page
    .getByPlaceholder("Buscar ativo, código ou instituição")
    .fill("Ativo CDB E2E");
  await expect(page.getByRole("link", { name: /Ativo CDB E2E/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ativo Ação E2E/ })).toHaveCount(
    0,
  );
});

test("quote updates report both success and a controlled external HTTP failure", async ({
  page,
  financeServer,
}) => {
  await page.goto("/investments/portfolio");
  await page.getByRole("button", { name: "Cadastrar ativo" }).click();
  const dialog = page.getByRole("dialog", { name: "Novo ativo" });
  await dialog
    .getByRole("textbox", { name: "Nome", exact: true })
    .fill("PETR E2E");
  await dialog
    .getByRole("textbox", { name: "Código", exact: true })
    .fill("PETR4");
  await saveDialog(dialog, "Criar ativo");
  await financeServer.market({ price: 42.5 });
  await page.getByRole("button", { name: "Atualizar cotações" }).click();
  await expect(
    page
      .getByText(/Atualiza|atualiza/)
      .filter({ hasText: /cotaç|Cot/ })
      .last(),
  ).toBeVisible();
  await financeServer.market({ status: 429 });
  await page.getByRole("button", { name: "Atualizar cotações" }).click();
  await expect(page.getByText(/429|falha|Falha/).last()).toBeVisible();
});
