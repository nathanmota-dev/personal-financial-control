import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** The demo has three active cards, but the detailed credit-card view needs a single one. */
export async function archiveExtraCreditCards(page: Page) {
  await page.goto("/settings");
  await page.getByRole("tab", { name: "Cartões", exact: true }).click();
  for (const name of ["Santander Unique", "Itaú Click"]) {
    const card = page.getByRole("listitem", { name, exact: true });
    await card.getByRole("button", { name: "Arquivar", exact: true }).click();
    await expect(card).toContainText("Arquivada");
  }
}

/**
 * Visible invoice row for a purchase. Streamed Suspense content can keep a hidden copy of the
 * row in the DOM until React reveals it, so hidden matches are ignored.
 */
export function invoiceRow(page: Page, description: string) {
  return page.locator("article").filter({ visible: true }).filter({ has: page.getByText(description, { exact: true }) });
}
