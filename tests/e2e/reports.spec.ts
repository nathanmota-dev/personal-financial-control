import { test, expect } from "./helpers/fixture";

test("expense groups open by default and reconcile card invoices, shares and annual categories on mobile", async ({ page, request }) => {
  const { accountIds, categoryIds } = await import("../../lib/demo/fixture");
  for (const [categoryId, description, amountCents] of [[categoryIds.rent, "Aluguel do relatório", 320000], [categoryIds.food, "Mercado do relatório", 150000]] as const) {
    const response = await request.post("/api/transactions", { data: { accountId: accountIds.checking, categoryId, description, type: "expense", status: "pending", amountCents, competenceMonth: "2024-06", transactionDate: "2024-06-05" } });
    expect(response.status()).toBe(201);
  }
  for (const [description, totalAmountCents, kind, installmentCount] of [["Compra no cartão do relatório", 80000, "purchase", 2], ["Estorno do relatório", -10000, "adjustment", 1]] as const) {
    const response = await request.post("/api/credit-card/charges", { data: { accountId: accountIds.credit, categoryId: categoryIds.food, description, totalAmountCents, kind, installmentCount, purchaseDate: "2024-05-20", firstInvoiceMonth: "2024-06" } });
    expect(response.status()).toBe(201);
  }
  await page.goto("/reports?mode=monthly&period=2024-06");
  const tab = page.getByRole("tab", { name: "Fixos x Variáveis", exact: true });
  await expect(tab).toHaveAttribute("aria-selected", "true");
  const cards = page.getByRole("region", { name: "Totais por grupo de despesa" });
  await expect(cards).toContainText(/Gastos fixos.*3.200,00.*64,0%/);
  await expect(cards).toContainText(/Gastos variáveis.*1.800,00.*36,0%/);
  await expect(page.getByText(/Total geral:/)).toContainText("5.000,00");
  const fixed = page.getByRole("region", { name: "Gastos fixos", exact: true });
  const variable = page.getByRole("region", { name: "Gastos variáveis", exact: true });
  await expect(fixed.getByRole("table")).toContainText("Aluguel do relatório");
  await expect(variable.getByRole("row").filter({ hasText: "Compra no cartão do relatório" })).toContainText(/Parcela de cartão.*20\/05\/2024.*400,00/);
  await expect(variable.locator("tfoot")).toContainText("1.800,00");
  await expect(page.getByRole("region", { name: "Sem classificação", exact: true })).toHaveCount(0);
  await page.screenshot({ path: "reports/expense-groups-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(variable.getByText("Compra no cartão do relatório", { exact: true }).last()).toBeVisible();
  await expect(variable.getByRole("table")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "reports/expense-groups-mobile.png", fullPage: true });
  await page.getByRole("tab", { name: "Anual", exact: true }).click();
  await expect(page).toHaveURL(/mode=annual&period=2024/);
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(variable.getByRole("list")).toContainText(/Alimentação.*2.200,00.*Ocorrências: 4.*100,0%/);
  await expect(variable.getByText("Compra no cartão do relatório", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "reports/expense-groups-annual-mobile.png", fullPage: true });
});

test("report URL preserves mode, navigation and explicit invalid periods", async ({ page }) => {
  await page.goto("/reports?mode=monthly&period=2026-07");
  await expect(page.getByRole("tab", { name: "Fixos x Variáveis", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Relatórios", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Período anterior", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "julho de 2026", exact: true }).click();
  await page.getByRole("button", { name: "Jun", exact: true }).click();
  await expect(page).toHaveURL(/mode=monthly&period=2026-06/);
  await page.reload();
  await expect(page.getByRole("button", { name: "junho de 2026", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/period=2026-07/);
  await page.goForward();
  await expect(page).toHaveURL(/period=2026-06/);
  await page.getByRole("tab", { name: "Anual", exact: true }).click();
  await expect(page).toHaveURL(/mode=annual&period=2026/);
  await page.getByRole("button", { name: "Selecionar ano: 2026" }).click();
  await page.getByRole("button", { name: "2027", exact: true }).click();
  await expect(page).toHaveURL(/mode=annual&period=2027/);
  await page.getByRole("tab", { name: "Mensal", exact: true }).click();
  await expect(page).toHaveURL(/mode=monthly&period=2026-06/);
  await expect(page.getByRole("button", { name: "junho de 2026", exact: true })).toBeVisible();
  await page.goto("/reports?mode=monthly&period=2026-13");
  await expect(page.getByRole("alert").filter({ hasText: "Período inválido" })).toContainText("Período inválido");
});

test("reports remain readable on mobile with textual tables and sources", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/reports?mode=monthly&period=2026-07");
  await page.getByRole("tab", { name: "Meses do ano", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Meses do ano", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Categorias", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Categorias e comparação" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Meses do ano", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Origens dos totais", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Origens dos totais" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evolução mensal" })).toHaveCount(0);
  await expect(page.getByRole("article", { name: "Receitas", exact: true })).toHaveCount(0);
  await expect(page.getByText("Regime de competência:", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "reports/reports-mobile.png", fullPage: true });
});

test("expense groups are visible while secondary report requests are pending", async ({ page }) => {
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => { release = resolve; });
  const requested: string[] = [];
  await page.route("**/api/reports?*", async (route) => {
    const view = new URL(route.request().url()).searchParams.get("view")!;
    requested.push(view);
    if (view === "categories") await blocked;
    await route.continue();
  });
  await page.goto("/reports?mode=monthly&period=2026-07");
  await expect(page.getByRole("tab", { name: "Fixos x Variáveis", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Distribuição dos gastos", exact: true })).toBeVisible();
  await expect.poll(() => [...requested].sort()).toEqual(["categories", "daily-expenses", "sources"]);
  await page.getByRole("tab", { name: "Origens dos totais", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Origens dos totais" })).toBeVisible();
  await page.getByRole("tab", { name: "Categorias", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Carregando");
  release();
  await expect(page.getByRole("heading", { name: "Categorias e comparação" })).toBeVisible();
  await expect.poll(() => [...requested].sort()).toEqual(["categories", "daily-expenses", "sources"]);
});

test("monthly summary explains both months on demand and works by keyboard on mobile", async ({ page, request }) => {
  const { accountIds, categoryIds } = await import("../../lib/demo/fixture");
  const categoryId = categoryIds.food;
  for (const [month, amountCents] of [["2024-05", 50000], ["2024-06", 70000]] as const) {
    const response = await request.post("/api/transactions", { data: { accountId: accountIds.checking, categoryId, description: month === "2024-05" ? "Mercado anterior" : "Mercado atual", type: "expense", status: "posted", amountCents, competenceMonth: month, transactionDate: `${month}-05` } });
    expect(response.status()).toBe(201);
  }
  const requested: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/api/reports?")) requested.push(new URL(request.url()).searchParams.get("view")!); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/reports?mode=monthly&period=2024-06");
  await expect(page.getByRole("tab", { name: "Fixos x Variáveis", exact: true })).toHaveAttribute("aria-selected", "true");
  expect(requested).not.toContain("summary");
  await page.getByRole("tab", { name: "Meses do ano", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Resumo do mês", exact: true })).toBeFocused();
  await expect(page.getByText(/aumento de/)).toContainText(/200,00.*40%/);
  const evidence = page.getByRole("region", { name: "Despesas de Alimentação nos dois meses" });
  await expect(evidence.getByText("Mercado anterior", { exact: true })).toBeVisible();
  await expect(evidence.getByText("Mercado atual", { exact: true })).toBeVisible();
  await expect(evidence.getByRole("link", { name: "Lançamento" }).first()).toHaveAttribute("href", "/transactions?month=2024-05");
  await expect(page.locator("details")).toHaveCount(0);
  await expect(page.getByRole("tabpanel", { name: "Resumo do mês" })).not.toContainText(/2024-0[56]/);
  const requestsBefore = requested.length;
  for (const name of ["Fixos x Variáveis", "Meses do ano", "Categorias", "Origens dos totais", "Resumo do mês"]) await page.getByRole("tab", { name, exact: true }).click();
  await expect(evidence.getByText("Mercado anterior", { exact: true })).toBeVisible();
  expect(requested).toHaveLength(requestsBefore);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "reports/monthly-summary-mobile.png", fullPage: true });
  await page.getByRole("tab", { name: "Resumo do mês", exact: true }).focus();
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: "Fixos x Variáveis", exact: true })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Fixos x Variáveis", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Visão mensal", exact: true })).toBeVisible();
  await page.goBack();
  await page.getByRole("tab", { name: "Resumo do mês", exact: true }).click();
  await expect(evidence.getByText("Mercado anterior", { exact: true })).toBeVisible();
  expect(requested.filter((view) => view === "summary")).toHaveLength(2);
});

test("partial summary avoids conclusive changes and request failures never render fake totals", async ({ page }) => {
  let fail = true;
  await page.route("**/api/reports?*view=summary", async (route) => {
    if (fail) await route.fulfill({ status: 500, json: { error: "Unavailable" } });
    else await route.continue();
  });
  await page.goto("/reports?mode=monthly&period=2026-07");
  await page.getByRole("tab", { name: "Resumo do mês", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Resumo do mês" }).getByRole("alert")).toContainText("Não foi possível carregar");
  await expect(page.getByRole("tabpanel", { name: "Resumo do mês" }).getByText("Resultado antes dos investimentos", { exact: true })).toHaveCount(0);
  fail = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByText(/Resumo parcial: mês em andamento/)).toBeVisible();
  await expect(page.getByText(/Comparação conclusiva disponível/)).toBeVisible();
  await expect(page.getByText(/aumento de|redução de/)).toHaveCount(0);
  await page.screenshot({ path: "reports/monthly-summary-desktop.png", fullPage: true });
});

test("monthly daily expense map reconciles purchases and credits by purchase date", async ({ page, request }) => {
  const { accountIds, categoryIds } = await import("../../lib/demo/fixture");
  const purchase = await request.post("/api/credit-card/charges", { data: {
    accountId: accountIds.credit, categoryId: categoryIds.leisure, description: "Compra parcelada do mapa",
    purchaseDate: "2026-07-12", totalAmountCents: 90000, installmentCount: 3, firstInvoiceMonth: "2026-08",
  } });
  expect(purchase.status()).toBe(201);
  const refund = await request.post("/api/credit-card/charges", { data: {
    accountId: accountIds.credit, categoryId: categoryIds.leisure, description: "Estorno do mapa",
    purchaseDate: "2026-07-12", totalAmountCents: -5000, kind: "adjustment", installmentCount: 1, firstInvoiceMonth: "2026-08",
  } });
  expect(refund.status()).toBe(201);
  const posted = await request.post("/api/transactions", { data: {
    accountId: accountIds.checking, categoryId: categoryIds.groceries, description: "Compra com data real",
    type: "expense", status: "posted", amountCents: 20000, competenceMonth: "2026-06", transactionDate: "2026-07-13",
  } });
  expect(posted.status()).toBe(201);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/reports?mode=monthly&period=2026-07");
  await expect(page.getByRole("tab", { name: "Fixos x Variáveis", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Despesas por data", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Despesas por data da transação/compra" })).toBeVisible();
  const purchaseDay = page.getByRole("button", { name: /12\/07\/2026\. Gastos positivos/ });
  await purchaseDay.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Movimentos de 12/07/2026" })).toBeVisible();
  const detail = page.getByRole("heading", { name: "Movimentos de 12/07/2026" }).locator("xpath=ancestor::*[@data-slot='card'][1]");
  await expect(detail).toContainText("Compra parcelada do mapa");
  await expect(detail).toContainText("Estorno do mapa");
  await expect(detail).toContainText("900,00");
  await expect(detail).toContainText("50,00");
  await expect(detail).toContainText("960,00");
  await expect(detail.getByRole("link", { name: "Abrir compra" }).first()).toHaveAttribute("href", "/credit-card?month=2026-08");

  await page.getByRole("button", { name: "Ver itens de 13/07/2026" }).click();
  const postedDay = page.getByRole("heading", { name: "Movimentos de 13/07/2026" }).locator("xpath=ancestor::*[@data-slot='card'][1]");
  await expect(postedDay).toContainText("Compra com data real");
  await expect(postedDay.getByRole("link", { name: "Abrir lançamento" })).toHaveAttribute("href", "/transactions?month=2026-06");
  await expect(postedDay).not.toContainText("Cinema e lazer");
  await expect(postedDay).not.toContainText("Curso cancelado");

  await page.getByRole("tab", { name: "Meses do ano", exact: true }).click();
  await page.getByRole("tab", { name: "Anual", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Despesas por data", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
