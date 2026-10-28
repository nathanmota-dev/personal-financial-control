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
test("Google login, PIN setup, idle locking, unlock and PIN recovery", async ({ page, context, finance }) => {
  const login = () => context.request.post(`${finance.url}/api/session`, { headers: { Origin: finance.url }, data: { idToken: "onboarding-a" } });
  expect((await login()).status()).toBe(200);
  await page.clock.install();
  await page.goto(`${finance.url}/settings`);
  await expect(page).toHaveURL(/\/lock\?next=/);
  await page.getByLabel("PIN", { exact: true }).fill("123456");
  await page.getByLabel("Confirmar PIN").fill("123456");
  await page.getByRole("button", { name: "Definir PIN" }).click();
  await expect(page).toHaveURL(`${finance.url}/settings`);
  await page.getByRole("dialog").getByRole("button", { name: "Pular configuração", exact: true }).click();
  await page.goto(`${finance.url}/settings`);
  await page.getByLabel("Minutos de inatividade (1–120)").fill("1");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Configurações salvas." })).toBeVisible();
  await page.screenshot({ path: "reports/security-settings.png", fullPage: true });
  await page.clock.fastForward(61000);
  await expect(page).toHaveURL(/\/lock/);
  expect((await context.request.get(`${finance.url}/api/accounts`)).status()).toBe(423);
  await page.getByLabel("PIN", { exact: true }).fill("000000");
  await page.getByRole("button", { name: "Destravar", exact: true }).click();
  await expect(page.getByText("4 tentativas restantes.")).toBeVisible();
  await page.getByLabel("PIN", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Destravar", exact: true }).click();
  await expect(page).toHaveURL(`${finance.url}/settings`);
  await context.request.delete(`${finance.url}/api/session/activity`, { headers: { Origin: finance.url, "Content-Type": "application/json" } });
  await page.goto(`${finance.url}/lock`);
  await page.getByRole("button", { name: "Esqueci o PIN" }).click();
  await expect(page).toHaveURL(/\/login/);
  expect((await login()).status()).toBe(200);
  await page.goto(`${finance.url}/lock`);
  await page.getByLabel("PIN", { exact: true }).fill("654321");
  await page.getByLabel("Confirmar PIN").fill("654321");
  await page.screenshot({ path: "reports/local-pin-setup.png", fullPage: true });
  await page.getByRole("button", { name: "Definir PIN" }).click();
  await expect(page).toHaveURL(`${finance.url}/dashboard`);
});
