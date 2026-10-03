import { screen } from "@testing-library/react";
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
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(screen.getByRole("option", { name: "Dashboard" })).toBeVisible();
});
