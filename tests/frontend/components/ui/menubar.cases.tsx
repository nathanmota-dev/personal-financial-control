import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import * as M from "@/components/ui/menubar";
it.each([true, false])(
  "supports menu actions, checked items and submenus (inset %s)",
  async (inset) => {
    const select = vi.fn(),
      check = vi.fn(),
      radio = vi.fn();
    const { user } = renderUI(
      <M.Menubar>
        <M.MenubarMenu>
          <M.MenubarTrigger>Opções</M.MenubarTrigger>
          <M.MenubarContent>
            <M.MenubarGroup>
              <M.MenubarLabel inset={inset}>Conta</M.MenubarLabel>
              <M.MenubarItem inset={inset} onSelect={select}>
                Editar<M.MenubarShortcut>E</M.MenubarShortcut>
              </M.MenubarItem>
              <M.MenubarItem variant="destructive">Excluir</M.MenubarItem>
            </M.MenubarGroup>
            <M.MenubarSeparator />
            <M.MenubarCheckboxItem checked onCheckedChange={check}>
              Exibir saldos
            </M.MenubarCheckboxItem>
            <M.MenubarRadioGroup value="month" onValueChange={radio}>
              <M.MenubarRadioItem value="month">Mensal</M.MenubarRadioItem>
              <M.MenubarRadioItem value="year">Anual</M.MenubarRadioItem>
            </M.MenubarRadioGroup>
            <M.MenubarSub>
              <M.MenubarSubTrigger inset={inset}>Exportar</M.MenubarSubTrigger>
              <M.MenubarPortal>
                <M.MenubarSubContent>
                  <M.MenubarItem>CSV</M.MenubarItem>
                </M.MenubarSubContent>
              </M.MenubarPortal>
            </M.MenubarSub>
          </M.MenubarContent>
        </M.MenubarMenu>
      </M.Menubar>,
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
