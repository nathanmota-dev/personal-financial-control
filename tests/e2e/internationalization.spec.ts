import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/fixture";

function watchForHydrationErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    if (/hydration failed|hydration mismatch/i.test(error.message)) errors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration failed|hydration mismatch/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  return errors;
}

test.describe("regional browser language", () => {
  test.use({ locale: "en-GB" });

  test("selects English for a regional preference", async ({ page }) => {
    const hydrationErrors = watchForHydrationErrors(page);

    await page.goto("/dashboard");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Monthly view", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open account preferences" })).toBeVisible();
    expect(hydrationErrors).toEqual([]);
  });
});

test("language selection updates the UI, persists in storage, and keeps the route", async ({ page }) => {
  const hydrationErrors = watchForHydrationErrors(page);
  await page.goto("/login");
  const origin = new URL(page.url()).origin;
  await page.context().addCookies([{ name: "locale", value: "pt", url: origin }]);
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Visão mensal", exact: true })).toBeVisible();
  const route = page.url();
  await page.getByRole("button", { name: "Abrir preferências da conta" }).click();
  const preferences = page.getByRole("dialog");
  await preferences.getByRole("button", { name: "Inglês" }).click();

  await expect(page).toHaveURL(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Monthly view", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("locale"))).toBe("en");
  await expect.poll(() => page.evaluate(() => document.cookie)).toContain("locale=en");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Monthly view", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Open account preferences" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Portuguese" }).click();
  await expect(page).toHaveURL(route);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("heading", { name: "Visão mensal", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("locale"))).toBe("pt");
  await expect.poll(() => page.evaluate(() => document.cookie)).toContain("locale=pt");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("heading", { name: "Visão mensal", exact: true })).toBeVisible();
  expect(hydrationErrors).toEqual([]);
});

test.describe("unsupported browser language", () => {
  test.use({ locale: "fr-FR" });

  test("falls back to Portuguese", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.getByRole("heading", { name: "Visão mensal", exact: true })).toBeVisible();
  });
});
