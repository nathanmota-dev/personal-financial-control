import { screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandEmpty,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  CommandDialog,
} from "@/components/ui/command";
it("filters commands, handles empty results and runs a choice", async () => {
  const select = vi.fn();
  const { user } = renderUI(
    <Command>
      <CommandInput aria-label="Buscar comando" />
      <CommandList>
        <CommandEmpty>Nenhum comando</CommandEmpty>
        <CommandGroup heading="Páginas">
          <CommandItem value="metas" onSelect={select}>
            Metas<CommandShortcut>M</CommandShortcut>
          </CommandItem>
          <CommandSeparator />
          <CommandItem value="contas">Contas</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>,
  );
  await user.type(screen.getByRole("combobox"), "zzzz");
  expect(screen.getByText("Nenhum comando")).toBeVisible();
  await user.clear(screen.getByRole("combobox"));
  await user.type(screen.getByRole("combobox"), "metas");
  await user.click(screen.getByRole("option", { name: /Metas/ }));
  expect(select).toHaveBeenCalledWith("metas");
});
it("embeds a command in a labelled dialog", () => {
  renderUI(
    <CommandDialog
      open
      title="Buscar página"
      description="Escolha o destino"
      showCloseButton
    >
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem>Dashboard</CommandItem>
        </CommandList>
      </Command>
    </CommandDialog>,
  );
  expect(screen.getByRole("dialog", { name: "Buscar página" })).toBeVisible();
  expect(screen.getByRole("dialog")).toHaveAccessibleDescription("Escolha o destino");
  expect(screen.getByRole("option", { name: "Dashboard" })).toBeVisible();
});
it("omits closed dialog text from server HTML and the client DOM", () => {
  const dialog = (
    <CommandDialog open={false} title="Menu de comandos" description="Escolha o destino">
      <Command><CommandInput /></Command>
    </CommandDialog>
  );

  expect(renderToString(dialog)).not.toContain("Menu de comandos");
  expect(renderToString(dialog)).not.toContain("Escolha o destino");
  renderUI(dialog);
  expect(screen.queryByText("Menu de comandos")).not.toBeInTheDocument();
  expect(screen.queryByText("Escolha o destino")).not.toBeInTheDocument();
});
