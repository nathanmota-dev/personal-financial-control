import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

export async function choose(scope: Locator, label: string, option: string) {
  await scope.getByRole("combobox", { name: label, exact: true }).click();
  await scope.page().getByRole("option", { name: option, exact: true }).click();
}

export async function saveDialog(dialog: Locator, button = "Salvar") {
  await dialog.getByRole("button", { name: button, exact: true }).click();
  await expect(dialog).toBeHidden();
}
