import { expect, test } from "@playwright/test";

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
