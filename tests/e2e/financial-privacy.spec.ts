import { test, expect } from "./helpers/fixture";
import { financialPrivacyKey } from "../../lib/financial-privacy";

const routes = [
  "/dashboard?month=2026-07", "/transactions?month=2026-07", "/credit-card?month=2026-07",
  "/recurring?month=2026-07", "/projected-balance", "/investments", "/investments/portfolio",
  "/investments/emergency-reserve", "/goals", "/settings", "/budgets?month=2026-07", "/reports?month=2026-07",
];

test("global privacy covers every financial domain, details, charts and reload without transient exposure", async ({ page, request }) => {
  test.setTimeout(120_000);
  const mutations: string[] = [];
  page.on("request", request => {
    if (["POST", "PATCH", "DELETE"].includes(request.method()) && request.url().includes("/api/")) mutations.push(request.url());
  });
  await page.goto(routes[0]);
  const income = page.getByRole("article", { name: "Receitas" });
  await expect(income).toContainText("6.500,00");
  const before = (await (await request.get("/api/transactions?competenceMonth=2026-07")).json()).transactions;
  const original = await income.locator("p").nth(1).innerText();
  await page.getByRole("button", { name: "Ocultar valores", exact: true }).click();
  await expect(income).toContainText("Valor oculto");
  await page.getByRole("button", { name: "Recolher sidebar" }).click();
  await expect(page.getByRole("button", { name: "Mostrar valores", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "julho de 2026" }).click();
  await page.getByRole("button", { name: "Jun", exact: true }).click();
  await expect(income).toContainText("Valor oculto");
  await page.addInitScript(() => {
    const leaks: string[] = [];
    Object.assign(window, { privacyLeaks: leaks });
    new MutationObserver(() => {
      const body = document.body;
      if (!body) return;
      const presentation = [body.innerText, ...Array.from(body.querySelectorAll("[title], [aria-label], svg text, svg title"), node => `${node.getAttribute("title") ?? ""} ${node.getAttribute("aria-label") ?? ""} ${node.tagName.toLowerCase() === "title" || node.tagName.toLowerCase() === "text" ? node.textContent : ""}`)].join(" ");
      if (/R\$\s*[−+-]?\s*\d/.test(presentation)) leaks.push(presentation.slice(0, 1000));
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true });
  });
  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole("button", { name: "Mostrar valores", exact: true })).toBeVisible();
    await expect(page.getByText("Valor oculto", { exact: false }).first()).toBeVisible();
    expect(await page.locator("body").innerText()).not.toMatch(/R\$\s*[−+-]?\s*\d/);
    expect(await page.evaluate(() => (window as unknown as { privacyLeaks: string[] }).privacyLeaks)).toEqual([]);
    if (route === "/projected-balance") {
      await page.getByRole("tab", { name: "Tabela", exact: true }).click();
      await expect(page.getByRole("table")).not.toContainText(/R\$\s*\d/);
      await page.getByRole("tab", { name: "Calendário", exact: true }).click();
      await page.getByRole("button", { name: /^\d{2}\/\d{2}\/2026\./ }).first().click();
      await expect(page.getByRole("dialog")).not.toContainText(/R\$\s*\d/);
      await page.getByRole("dialog").getByRole("button", { name: /Fechar|Close/ }).click();
    }
    if (route.startsWith("/dashboard") || route === "/projected-balance") {
      await expect(page.locator(".recharts-surface")).toHaveCount(0);
      await expect(page.locator('[data-slot="chart"]').first()).toContainText("Valor oculto");
    }
  }
  await expect(page.getByRole("button", { name: "Exportar resumo" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mostrar valores para exportar" })).toBeVisible();
  await page.goto("/investments/portfolio");
  const assetLink = page.locator('main a[href^="/investments/assets/"]').first();
  await assetLink.click();
  await expect(page.getByText("Quantidade", { exact: true }).locator('xpath=ancestor::*[@data-slot="card"][1]')).toContainText("Valor oculto");
  await page.getByRole("button", { name: "Operação", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Mostrar valores para editar" }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), financialPrivacyKey(true))).toBe("hidden");
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.getByText("Quantidade", { exact: true }).locator('xpath=ancestor::*[@data-slot="card"][1]')).toContainText("Valor oculto");
  await page.goto(routes[0]);
  await page.reload();
  await expect(page.getByRole("article", { name: "Receitas" })).toContainText("Valor oculto");
  expect(await page.evaluate(() => (window as unknown as { privacyLeaks: string[] }).privacyLeaks)).toEqual([]);
  await page.screenshot({ path: "reports/privacy-desktop.png" });
  await page.getByRole("button", { name: "Mostrar valores", exact: true }).click();
  await expect(page.getByRole("article", { name: "Receitas" }).locator("p").nth(1)).toHaveText(original, { useInnerText: true });
  expect(mutations).toEqual([]);
  expect((await (await request.get("/api/transactions?competenceMonth=2026-07")).json()).transactions).toEqual(before);
  expect(await page.evaluate(key => localStorage.getItem(key), financialPrivacyKey(true))).toBe("visible");
});

test("monetary editing requires consent, preserves the real draft and returns to hidden on close", async ({ page }) => {
  await page.goto("/transactions?month=2026-07");
  await page.getByRole("button", { name: "Ocultar valores", exact: true }).click();
  const edit = page.getByRole("button", { name: "Editar lançamento" }).first();
  await edit.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Mostrar valores para editar" }).click();
  const amount = dialog.getByLabel("Valor", { exact: true });
  const original = await amount.inputValue();
  expect(original).not.toBe("Valor oculto");
  await amount.fill("123,45");
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(page.locator("body")).not.toContainText(/R\$\s*\d/);
  expect(await page.evaluate(key => localStorage.getItem(key), financialPrivacyKey(true))).toBe("hidden");
});

test("mobile keyboard control and blocked storage remain usable with isolated demo preference", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(key => {
    localStorage.setItem(key, "hidden");
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
  }, financialPrivacyKey(false));
  await page.goto("/dashboard?month=2026-07");
  const show = page.getByRole("button", { name: "Mostrar valores", exact: true });
  await show.focus();
  await page.keyboard.press("Enter");
  const hide = page.getByRole("button", { name: "Ocultar valores", exact: true });
  await hide.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Mostrar valores", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Ativar tema/ }).click();
  await expect(page.locator("body")).not.toContainText(/R\$\s*\d/);
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Lançamentos", exact: true }).click();
  await expect(page.locator("body")).not.toContainText(/R\$\s*\d/);
  await page.goto("/calculators/compound-interest");
  await page.getByRole("button", { name: "Mostrar valores", exact: true }).click();
  await page.getByLabel("Valor inicial").fill("1.000,00");
  await page.getByLabel("Valor mensal").fill("100,00");
  await page.getByLabel("Taxa de juros").fill("0");
  await page.getByLabel("Período", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  const result = page.locator('[data-slot="card"]').filter({ hasText: "Valor total final" });
  await expect(result).toContainText("2.200,00");
  await page.getByRole("button", { name: "Ocultar valores", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mostrar valores para editar" })).toBeVisible();
  await expect(result).toContainText("Valor oculto");
  await expect(page.locator(".recharts-surface")).toHaveCount(0);
  await page.screenshot({ path: "reports/privacy-mobile.png" });
  await page.getByRole("button", { name: "Mostrar valores para editar" }).click();
  await expect(page.getByLabel("Valor inicial")).toHaveValue("1.000,00");
  await expect(result).toContainText("Valor oculto");
});
