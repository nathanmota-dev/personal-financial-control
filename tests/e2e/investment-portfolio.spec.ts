import { test, expect } from "./helpers/fixture";
import { saveDialog } from "./helpers/forms";

test("registers all supported asset types and filters positions", async ({
  page,
}) => {
  await page.goto("/investments/portfolio");
  for (const type of ["Ação", "FII", "ETF", "Tesouro", "CDB", "LCI", "LCA"]) {
    await page.getByRole("button", { name: "Cadastrar ativo" }).click();
    const dialog = page.getByRole("dialog", { name: "Novo ativo" });
    await dialog
      .getByRole("textbox", { name: "Nome", exact: true })
      .fill(`Ativo ${type} E2E`);
    await dialog
      .getByRole("textbox", { name: "Código", exact: true })
      .fill(
        type === "Ação"
          ? "PETR4"
          : type === "FII"
            ? "HGLG11"
            : type === "ETF"
              ? "BOVA11"
              : "",
      );
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: type, exact: true }).click();
    await saveDialog(dialog, "Criar ativo");
    await expect(
      page.getByRole("link", { name: new RegExp(`Ativo ${type} E2E`) }),
    ).toBeVisible();
  }
  await page
    .getByPlaceholder("Buscar ativo, código ou instituição")
    .fill("Ativo CDB E2E");
  await expect(page.getByRole("link", { name: /Ativo CDB E2E/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ativo Ação E2E/ })).toHaveCount(
    0,
  );
});

test("quote updates report both success and a controlled external HTTP failure", async ({
  page,
  financeServer,
}) => {
  await page.goto("/investments/portfolio");
  await page.getByRole("button", { name: "Cadastrar ativo" }).click();
  const dialog = page.getByRole("dialog", { name: "Novo ativo" });
  await dialog
    .getByRole("textbox", { name: "Nome", exact: true })
    .fill("PETR E2E");
  await dialog
    .getByRole("textbox", { name: "Código", exact: true })
    .fill("PETR4");
  await saveDialog(dialog, "Criar ativo");
  await financeServer.market({ price: 42.5 });
  await page.getByRole("button", { name: "Atualizar cotações" }).click();
  await expect(
    page
      .getByText(/Atualiza|atualiza/)
      .filter({ hasText: /cotaç|Cot/ })
      .last(),
  ).toBeVisible();
  await financeServer.market({ status: 429 });
  await page.getByRole("button", { name: "Atualizar cotações" }).click();
  await expect(page.getByText(/429|falha|Falha/).last()).toBeVisible();
});
