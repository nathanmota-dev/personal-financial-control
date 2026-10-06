import { expect, test } from "@playwright/test";

test("report exports without a session never expose financial CSV", async ({ request }) => {
  const response = await request.get("/api/reports/export?mode=monthly&period=2026-07&kind=summary");
  expect(response.ok()).toBe(false);
  expect(response.headers()["content-type"]).not.toContain("text/csv");
  expect(response.headers()["cache-control"]).toBe("private, no-store");
  expect(response.headers()["content-disposition"]).toBeUndefined();
});

test("Google login shows a recoverable error when Firebase is unavailable", async ({ page }) => {
  await page.goto("/login");
  const google = page.getByRole("button", { name: "Continuar com Google" });
  await expect(google).toBeVisible();
  await google.click();
  await expect(page.getByRole("status")).toHaveText("Login indisponível. Configure o Firebase.");
  await expect(google).toBeEnabled();
  await expect(google).toHaveAttribute("aria-busy", "false");
  await expect(page).toHaveURL(/\/login$/);
  await google.click();
  await expect(page.getByRole("status")).toHaveText("Login indisponível. Configure o Firebase.");
  await expect(google).toBeEnabled();
});

test("login advances automatically and floats the preview on hover", async ({ page }) => {
  await page.goto("/login");
  const first = page.getByRole("group", { name: /1 de 3:/ });
  await expect(first).toBeVisible();
  await expect(page.getByRole("group", { name: /2 de 3:/ })).toBeVisible({ timeout: 9000 });
  const preview = page.getByRole("group", { name: /2 de 3:/ }).locator(".login-preview");
  await preview.hover();
  await expect(preview).toHaveCSS("animation-name", "login-preview-float");
  await page.getByRole("button", { name: "Pausar slides automáticos" }).click();
  await expect(page.getByRole("button", { name: "Retomar slides automáticos" })).toBeVisible();
  await page.screenshot({ path: "reports/login-preview.png" });
});
