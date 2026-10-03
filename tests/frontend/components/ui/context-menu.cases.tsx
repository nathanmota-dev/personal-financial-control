import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import * as M from "@/components/ui/context-menu";
it.each([true, false])(
  "supports menu actions, checked items and submenus (inset %s)",
  async (inset) => {
    const select = vi.fn(),
      check = vi.fn(),
      radio = vi.fn();
    const { user } = renderUI(
      <M.ContextMenu>
        <M.ContextMenuTrigger>Opções</M.ContextMenuTrigger>
        <M.ContextMenuContent>
          <M.ContextMenuGroup>
            <M.ContextMenuLabel inset={inset}>Conta</M.ContextMenuLabel>
            <M.ContextMenuItem inset={inset} onSelect={select}>
              Editar<M.ContextMenuShortcut>E</M.ContextMenuShortcut>
            </M.ContextMenuItem>
            <M.ContextMenuItem variant="destructive">Excluir</M.ContextMenuItem>
          </M.ContextMenuGroup>
          <M.ContextMenuSeparator />
          <M.ContextMenuCheckboxItem checked onCheckedChange={check}>
            Exibir saldos
          </M.ContextMenuCheckboxItem>
          <M.ContextMenuRadioGroup value="month" onValueChange={radio}>
            <M.ContextMenuRadioItem value="month">
              Mensal
            </M.ContextMenuRadioItem>
            <M.ContextMenuRadioItem value="year">Anual</M.ContextMenuRadioItem>
          </M.ContextMenuRadioGroup>
          <M.ContextMenuSub>
            <M.ContextMenuSubTrigger inset={inset}>
              Exportar
            </M.ContextMenuSubTrigger>
            <M.ContextMenuPortal>
              <M.ContextMenuSubContent>
                <M.ContextMenuItem>CSV</M.ContextMenuItem>
              </M.ContextMenuSubContent>
            </M.ContextMenuPortal>
          </M.ContextMenuSub>
        </M.ContextMenuContent>
      </M.ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText("Opções"));
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Exibir saldos" }),
    ).toHaveAttribute("aria-checked", "true");
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "Exibir saldos" }),
    );
    expect(check).toHaveBeenCalledWith(false);
    fireEvent.contextMenu(screen.getByText("Opções"));
    await user.click(screen.getByRole("menuitemradio", { name: "Anual" }));
    expect(radio).toHaveBeenCalledWith("year");
    fireEvent.contextMenu(screen.getByText("Opções"));
    await user.hover(screen.getByRole("menuitem", { name: "Exportar" }));
    expect(await screen.findByRole("menuitem", { name: "CSV" })).toBeVisible();
    await user.keyboard("{Escape}");
    await user.keyboard("{Escape}");
    fireEvent.contextMenu(screen.getByText("Opções"));
    await user.click(screen.getByRole("menuitem", { name: /^Editar/ }));
    expect(select).toHaveBeenCalledOnce();
  },
);
