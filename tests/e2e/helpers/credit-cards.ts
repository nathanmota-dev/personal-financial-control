import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** The demo has three active cards, but the detailed credit-card view needs a single one. */
export async function archiveExtraCreditCards(page: Page) {
  await page.goto("/settings");
  for (const name of ["Santander Unique", "Itaú Click"]) {
    const card = page.locator("[data-slot=card]").filter({ hasText: name });
    await card.getByRole("button", { name: "Arquivar", exact: true }).click();
    await expect(card).toContainText("Arquivada");
  }
}
