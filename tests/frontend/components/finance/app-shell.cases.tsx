import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { AppShell } from "@/components/finance/app-shell";
it("collapses and expands navigation without losing page content", async () => {
  const { user } = renderUI(
    <AppShell demoMode user={{ name: "Visitante", photoURL: null }}>
      <h1>Conteúdo financeiro</h1>
    </AppShell>,
  );
  expect(screen.getByText("Demo pública")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Recolher sidebar" }));
  expect(screen.queryByRole("navigation")).toBeNull();
  expect(
    screen.getByRole("heading", { name: "Conteúdo financeiro" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Expandir sidebar" }));
  expect(screen.getByRole("navigation")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Abrir menu" }));
  expect(screen.getByRole("dialog", { name: "Menu" })).toBeVisible();
});
