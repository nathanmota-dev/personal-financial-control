import { screen, waitFor, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { AppShell } from "@/components/finance/app-shell";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { navigation } from "../../setup";
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
  const link = within(screen.getByRole("dialog", { name: "Menu" }))
    .getByRole("link", { name: "Metas" });
  // JSDOM has no document navigation; exercise the menu's real click handler.
  link.addEventListener("click", (event) => event.preventDefault());
  await user.click(link);
  await waitFor(() => {
    expect(screen.getByRole("dialog", { name: "Menu" }))
      .toHaveAttribute("data-state", "closed");
  });
});

it("opens the same command menu with the shortcut and restores focus on Escape", async () => {
  const { user } = renderUI(
    <AppShell demoMode user={{ name: "Visitante", photoURL: null }}>
      <h1>Conteúdo financeiro</h1>
    </AppShell>,
  );
  const triggers = screen.getAllByRole("button", {
    name: /Abrir paleta de comandos/,
  });
  const trigger = triggers[0];
  trigger.focus();

  await user.keyboard("{Control>}k{/Control}");
  const commandDialog = await screen.findByRole("dialog", {
    name: "Menu de comandos",
  });
  expect(commandDialog).toBeVisible();
  await user.type(
    screen.getByRole("combobox", { name: "Buscar página ou ação" }),
    "cartao",
  );
  expect(screen.getByRole("option", { name: /^Cartão/ })).toBeVisible();

  await user.keyboard("{Escape}");
  await waitFor(() => expect(commandDialog).not.toBeInTheDocument());
  expect(trigger).toHaveFocus();
});

it("does not open the command menu over an active form dialog", async () => {
  const { user } = renderUI(
    <AppShell demoMode user={{ name: "Visitante", photoURL: null }}>
      <Dialog open>
        <DialogContent>
          <DialogTitle>Formulário em edição</DialogTitle>
          <input aria-label="Rascunho" defaultValue="Manter" />
        </DialogContent>
      </Dialog>
    </AppShell>,
  );

  await user.keyboard("{Control>}k{/Control}");
  expect(screen.getByRole("dialog", { name: "Formulário em edição" })).toBeVisible();
  expect(
    screen.queryByRole("dialog", { name: "Menu de comandos" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Rascunho" })).toHaveValue("Manter");
});

it("opens create actions and navigates to pages without carrying incompatible filters", async () => {
  navigation.pathname = "/dashboard";
  navigation.search = new URLSearchParams("month=2026-08&categoryId=old");
  const { user } = renderUI(
    <AppShell demoMode user={{ name: "Visitante", photoURL: null }}>
      <h1>Conteúdo financeiro</h1>
    </AppShell>,
  );
  const trigger = screen.getAllByRole("button", {
    name: /Abrir paleta de comandos/,
  })[0];

  await user.click(trigger);
  const search = screen.getByRole("combobox", {
    name: "Buscar página ou ação",
  });
  await user.type(search, "nova despesa");
  await user.keyboard("{Enter}");
  expect(navigation.push).toHaveBeenCalledWith(
    expect.stringMatching(
      /^\/transactions\?month=2026-08&command=new-expense&commandId=/,
    ),
    { scroll: false },
  );

  await user.click(trigger);
  await user.type(
    screen.getByRole("combobox", { name: "Buscar página ou ação" }),
    "ajuda",
  );
  await user.keyboard("{Enter}");
  expect(navigation.push).toHaveBeenLastCalledWith("/help", { scroll: false });
});
