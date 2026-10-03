import { test, expect } from "./helpers/fixture";
import { helpGuides, helpQuestions } from "../../lib/help-content";

test("help guides and FAQ open, close and navigate", async ({ page }) => {
  await page.goto("/help");
  await expect(
    page.getByRole("heading", { name: "Como usar o Finance" }),
  ).toBeVisible();
  for (const guide of helpGuides)
    await expect(
      page.getByRole("link", { name: `${guide.title} ${guide.description}` }),
    ).toHaveAttribute("href", guide.href);
  for (const item of helpQuestions) {
    const question = page.getByText(item.question, { exact: true });
    await question.click();
    await expect(page.getByText(item.answer, { exact: true })).toBeVisible();
    await question.click();
    await expect(page.getByText(item.answer, { exact: true })).toBeHidden();
  }
  await page
    .getByRole("link", { name: "Configurar contas e categorias" })
    .click();
  await expect(page).toHaveURL(/\/settings$/);
});
