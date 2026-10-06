import { readFile } from "node:fs/promises";
import { test, expect } from "./helpers/fixture";
import { parseReportCsv, csvCents } from "../helpers/report-csv";

test("explicit downloads match monthly and annual displayed values on mobile", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let exportRequests = 0;
  page.on("request", (request) => { if (request.url().includes("/api/reports/export?")) exportRequests++; });
  await page.goto("/reports?mode=monthly&period=2026-07");
  await expect(page.getByRole("heading", { name: "Meses do ano", exact: true })).toBeVisible();
  expect(exportRequests).toBe(0);
  const downloadSummary = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar resumo", exact: true }).click();
  const summary = await downloadSummary;
  expect(summary.suggestedFilename()).toBe("relatorio-resumo-mensal-2026-07.csv");
  const summaryBytes = await readFile((await summary.path())!);
  expect([...summaryBytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  const monthly = parseReportCsv(summaryBytes.toString("utf8"));
  expect(monthly).toHaveLength(2);
  expect(monthly[1][0]).toBe("2026-07");
  const displayed = page.getByRole("row").filter({ has: page.getByRole("link", { name: "julho de 2026" }) });
  const cells = await displayed.getByRole("cell").allTextContents();
  for (const [csvIndex, cellIndex] of [[1, 1], [2, 2], [3, 3], [6, 4], [7, 5]]) {
    expect(cells[cellIndex].replace(/[^\d,-]/g, "")).toBe(monthly[1][csvIndex]);
  }
  const downloadCategories = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar categorias", exact: true }).click();
  const categories = await downloadCategories;
  expect(categories.suggestedFilename()).toBe("relatorio-categorias-mensal-2026-07.csv");
  const monthlyCategories = parseReportCsv(await readFile((await categories.path())!, "utf8"));
  expect(monthlyCategories.slice(1).reduce((sum, row) => sum + csvCents(row[3]), 0)).toBe(csvCents(monthly[1][2]));
  const response = await request.get("/api/reports?mode=monthly&period=2026-07&view=categories");
  for (const category of (await response.json()).categories.filter((row: { type: string }) => row.type === "expense")) {
    expect(monthlyCategories.slice(1).filter((row) => row[1] === category.id).reduce((sum, row) => sum + csvCents(row[3]), 0)).toBe(category.amountCents);
  }
  await page.getByRole("tab", { name: "Anual", exact: true }).click();
  await expect(page).toHaveURL(/mode=annual&period=2026/);
  const downloadAnnual = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar resumo", exact: true }).click();
  const annual = await downloadAnnual;
  expect(annual.suggestedFilename()).toBe("relatorio-resumo-anual-2026.csv");
  const yearly = parseReportCsv(await readFile((await annual.path())!, "utf8"));
  expect(yearly.slice(1).map((row) => row[0])).toEqual(["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "TOTAL"]);
  expect(csvCents(yearly.at(-1)![2])).toBe(yearly.slice(1, -1).reduce((sum, row) => sum + csvCents(row[2]), 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "reports/report-export-mobile.png", fullPage: true });
});

test("generation errors and HTML responses never trigger a download and can be retried", async ({ page }) => {
  let failure: "json" | "html" | null = "json";
  let downloads = 0;
  page.on("download", () => { downloads++; });
  await page.route("**/api/reports/export?*", async (route) => {
    if (failure === "json") await route.fulfill({ status: 500, json: { error: "Failed" } });
    else if (failure === "html") await route.fulfill({ status: 200, contentType: "text/html", body: "<html>Login</html>" });
    else await route.continue();
  });
  await page.goto("/reports?mode=monthly&period=2026-07");
  for (const type of ["json", "html"] as const) {
    failure = type;
    await page.getByRole("button", { name: "Exportar categorias", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Não foi possível exportar" })).toBeVisible();
    expect(downloads).toBe(0);
  }
  failure = null;
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar categorias", exact: true }).click();
  await download;
  await expect(page.getByRole("alert").filter({ hasText: "Não foi possível exportar" })).toHaveCount(0);
});
