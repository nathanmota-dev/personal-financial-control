import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import * as M from "@/components/ui/dropdown-menu";
it.each([true, false])(
  "supports menu actions, checked items and submenus (inset %s)",
  async (inset) => {
    const select = vi.fn(),
      check = vi.fn(),
      radio = vi.fn();
    const { user } = renderUI(
      <M.DropdownMenu>
        <M.DropdownMenuTrigger>Opções</M.DropdownMenuTrigger>
        <M.DropdownMenuContent>
          <M.DropdownMenuGroup>
            <M.DropdownMenuLabel inset={inset}>Conta</M.DropdownMenuLabel>
            <M.DropdownMenuItem inset={inset} onSelect={select}>
              Editar<M.DropdownMenuShortcut>E</M.DropdownMenuShortcut>
            </M.DropdownMenuItem>
            <M.DropdownMenuItem variant="destructive">
              Excluir
            </M.DropdownMenuItem>
          </M.DropdownMenuGroup>
          <M.DropdownMenuSeparator />
          <M.DropdownMenuCheckboxItem checked onCheckedChange={check}>
            Exibir saldos
          </M.DropdownMenuCheckboxItem>
          <M.DropdownMenuRadioGroup value="month" onValueChange={radio}>
            <M.DropdownMenuRadioItem value="month">
              Mensal
            </M.DropdownMenuRadioItem>
            <M.DropdownMenuRadioItem value="year">
              Anual
            </M.DropdownMenuRadioItem>
          </M.DropdownMenuRadioGroup>
          <M.DropdownMenuSub>
            <M.DropdownMenuSubTrigger inset={inset}>
              Exportar
            </M.DropdownMenuSubTrigger>
            <M.DropdownMenuPortal>
              <M.DropdownMenuSubContent>
                <M.DropdownMenuItem>CSV</M.DropdownMenuItem>
              </M.DropdownMenuSubContent>
            </M.DropdownMenuPortal>
          </M.DropdownMenuSub>
        </M.DropdownMenuContent>
      </M.DropdownMenu>,
    );
    await user.click(screen.getByText("Opções"));
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Exibir saldos" }),
    ).toHaveAttribute("aria-checked", "true");
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "Exibir saldos" }),
    );
    expect(check).toHaveBeenCalledWith(false);
    await user.click(screen.getByText("Opções"));
    await user.click(screen.getByRole("menuitemradio", { name: "Anual" }));
    expect(radio).toHaveBeenCalledWith("year");
    await user.click(screen.getByText("Opções"));
    await user.hover(screen.getByRole("menuitem", { name: "Exportar" }));
    expect(await screen.findByRole("menuitem", { name: "CSV" })).toBeVisible();
    await user.keyboard("{Escape}");
    await user.keyboard("{Escape}");
    await user.click(screen.getByText("Opções"));
    await user.click(screen.getByRole("menuitem", { name: /^Editar/ }));
    expect(select).toHaveBeenCalledOnce();
  },
);
