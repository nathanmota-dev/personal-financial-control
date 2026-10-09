import { test as base, expect } from "@playwright/test";
import { startFinanceServer } from "./helpers/server";
import type { FinanceServer } from "./helpers/contracts";

const test = base.extend<{ finance: FinanceServer }>({
  finance: [async ({}, deliver) => {
    const server = await startFinanceServer(true);
    try { await deliver(server); } finally { await server.close(); }
  }, { timeout: 60000 }],
});

test.use({ locale: "pt-BR" });

test("persists setup, reuses saved accounts and permanently completes", async ({ page, context, finance }) => {
  await context.addCookies([{ name: "session", value: "onboarding-a", url: finance.url }]);
  await page.goto(`${finance.url}/dashboard`);
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Etapa 1 de 5")).toBeVisible();
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByText("Escuro", { exact: true }).click();
  await expect(dialog.getByLabel("Escuro", { exact: true })).toBeChecked();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByLabel("Nome da conta").fill("Minha conta");
  await dialog.getByLabel("Saldo inicial (R$)").fill("123.45");
  await dialog.getByRole("button", { name: "Salvar conta" }).click();
  await expect(dialog.getByText("Minha conta", { exact: true })).toBeVisible();
  await page.reload();
  await expect(dialog.getByText("Etapa 3 de 5")).toBeVisible();
  await expect(dialog.getByText("Minha conta", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByLabel("Nome do cartão").fill("Meu cartão");
  await dialog.getByLabel("Dia de fechamento").fill("5");
  await dialog.getByLabel("Dia de vencimento").fill("12");
  await dialog.getByRole("button", { name: "Salvar cartão" }).click();
  await expect(dialog.getByText("Meu cartão", { exact: true })).toBeVisible();
  await page.screenshot({ path: "reports/onboarding-desktop-dark.png", fullPage: true });
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByRole("button", { name: "Ir para o Dashboard" }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(dialog).toBeHidden();
  const accounts = await (await page.request.get(`${finance.url}/api/accounts`)).json();
  expect(accounts.accounts).toHaveLength(2);
  expect(accounts.accounts.find((account: { type: string }) => account.type === "credit").initialBalanceCents).toBe(0);
});

test("dismisses for navigation, resumes on reload, isolates users and syncs tabs", async ({ page, context, finance }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await context.addCookies([{ name: "session", value: "onboarding-a", url: finance.url }]);
  await page.goto(`${finance.url}/dashboard`);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Configurações", exact: true }).first().click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(dialog.getByText("Etapa 1 de 5")).toBeVisible();
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByRole("button", { name: "Continuar" }).click();
  await dialog.getByRole("button", { name: "Pular etapa", exact: true }).click();
  await expect(dialog.getByText("Etapa 4 de 5")).toBeVisible();
  await dialog.getByRole("button", { name: "Voltar" }).click();
  await expect(dialog.getByText("Etapa 3 de 5")).toBeVisible();
  await page.screenshot({ path: "reports/onboarding-mobile.png", fullPage: true });
  const otherTab = await context.newPage();
  await otherTab.goto(`${finance.url}/dashboard`);
  await expect(otherTab.getByRole("dialog")).toBeVisible();
  await dialog.getByRole("button", { name: "Pular configuração", exact: true }).click();
  await expect(page).toHaveURL(`${finance.url}/dashboard`);
  await expect(dialog).toBeHidden();
  await otherTab.bringToFront();
  await otherTab.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(otherTab.getByRole("dialog")).toBeHidden();
  await otherTab.close();
  await page.reload();
  await expect(dialog).toBeHidden();
  await context.addCookies([{ name: "session", value: "onboarding-b", url: finance.url }]);
  await page.reload();
  await expect(dialog.getByText("Etapa 1 de 5")).toBeVisible();
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.reload();
  await expect(dialog).toBeVisible();
});

test("updates the authenticated display name, preserves email and refreshes sidebar identity", async ({ page, context, finance }) => {
  await context.addCookies([{ name: "session", value: "onboarding-a", url: finance.url }]);
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto(`${finance.url}/account`);
  await page.getByRole("dialog").getByRole("button", { name: "Pular configuração", exact: true }).click();
  await page.goto(`${finance.url}/account`);
  await page.getByLabel("Nome", { exact: true }).fill("Marina");
  await page.getByLabel("Sobrenome").fill("Silva");
  await expect(page.getByLabel("E-mail")).toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Nome de exibição atualizado." })).toBeVisible();
  await expect(page.locator("aside").getByText("Marina", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Marina");
  await expect(page.getByLabel("Sobrenome")).toHaveValue("Silva");
  await expect(page.getByLabel("E-mail")).toHaveValue("onboarding-a@example.test");
  const forbidden = await page.request.patch(`${finance.url}/api/profile`, {
    headers: { Origin: finance.url }, data: { firstName: "Marina", lastName: "Silva", email: "changed@example.test" },
  });
  expect(forbidden.status()).toBe(400);
  const back = await page.getByRole("button", { name: "Voltar", exact: true }).boundingBox();
  const heading = await page.getByRole("heading", { name: "Minha conta" }).boundingBox();
  expect(back!.x).toBe(heading!.x);
  expect(back!.y).toBeLessThan(heading!.y);
  await page.screenshot({ path: "reports/account-edit-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Abrir preferências da conta" }).click();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "reports/account-edit-mobile.png", fullPage: true });
});
