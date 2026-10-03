import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { TooltipProvider } from "@/components/ui/tooltip";
import * as S from "@/components/ui/sidebar";

it.each(["sidebar", "floating", "inset"] as const)(
  "composes a %s sidebar and persists keyboard toggles",
  async (variant) => {
    const click = vi.fn();
    const { user, container } = renderUI(
      <TooltipProvider delayDuration={0}>
        <S.SidebarProvider>
          <S.Sidebar variant={variant} side="right" collapsible="icon">
            <S.SidebarHeader>
              <S.SidebarInput aria-label="Buscar" />
            </S.SidebarHeader>
            <S.SidebarSeparator />
            <S.SidebarContent>
              <S.SidebarGroup>
                <S.SidebarGroupLabel>Contas</S.SidebarGroupLabel>
                <S.SidebarGroupAction>Novo</S.SidebarGroupAction>
                <S.SidebarGroupContent>
                  <S.SidebarMenu>
                    <S.SidebarMenuItem>
                      <S.SidebarMenuButton isActive tooltip="Principal">
                        Principal
                      </S.SidebarMenuButton>
                      <S.SidebarMenuAction showOnHover>
                        Editar
                      </S.SidebarMenuAction>
                      <S.SidebarMenuBadge>2</S.SidebarMenuBadge>
                      <S.SidebarMenuSub>
                        <S.SidebarMenuSubItem>
                          <S.SidebarMenuSubButton
                            href="/settings"
                            size="sm"
                            isActive
                          >
                            Configurações
                          </S.SidebarMenuSubButton>
                        </S.SidebarMenuSubItem>
                      </S.SidebarMenuSub>
                    </S.SidebarMenuItem>
                    <S.SidebarMenuItem>
                      <S.SidebarMenuButton
                        tooltip={{ children: "Reserva" }}
                        variant="outline"
                        size="lg"
                      >
                        Reserva
                      </S.SidebarMenuButton>
                    </S.SidebarMenuItem>
                  </S.SidebarMenu>
                </S.SidebarGroupContent>
              </S.SidebarGroup>
              <S.SidebarMenuSkeleton showIcon />
              <S.SidebarMenuSkeleton />
            </S.SidebarContent>
            <S.SidebarFooter>Rodapé</S.SidebarFooter>
            <S.SidebarRail />
          </S.Sidebar>
          <S.SidebarInset>
            <S.SidebarTrigger onClick={click} />
            Página
          </S.SidebarInset>
        </S.SidebarProvider>
      </TooltipProvider>,
    );
    expect(screen.getByRole("link", { name: "Configurações" })).toHaveAttribute(
      "href",
      "/settings",
    );
    await user.type(screen.getByRole("textbox"), "Principal");
    expect(screen.getByRole("textbox")).toHaveValue("Principal");
    await user.click(
      screen.getAllByRole("button", { name: "Toggle Sidebar" })[1],
    );
    expect(click).toHaveBeenCalledOnce();
    expect(document.cookie).toContain("sidebar_state=false");
    expect(container.querySelector('[data-slot="sidebar"]')).toHaveAttribute(
      "data-state",
      "collapsed",
    );
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(document.cookie).toContain("sidebar_state=true");
    fireEvent.keyDown(window, { key: "a", metaKey: true });
    expect(document.cookie).toContain("sidebar_state=true");
    await user.click(
      screen.getAllByRole("button", { name: "Toggle Sidebar" })[0],
    );
    expect(document.cookie).toContain("sidebar_state=false");
  },
);
it("supports controlled state and elements composed as links", async () => {
  const change = vi.fn();
  const { user } = renderUI(
    <S.SidebarProvider open onOpenChange={change}>
      <S.Sidebar collapsible="none">
        <S.SidebarGroup>
          <S.SidebarGroupLabel asChild>
            <h2>Grupo</h2>
          </S.SidebarGroupLabel>
          <S.SidebarGroupAction asChild>
            <a href="/new">Adicionar</a>
          </S.SidebarGroupAction>
          <S.SidebarMenu>
            <S.SidebarMenuItem>
              <S.SidebarMenuButton asChild>
                <a href="/dashboard">Dashboard</a>
              </S.SidebarMenuButton>
              <S.SidebarMenuAction asChild>
                <a href="/edit">Editar</a>
              </S.SidebarMenuAction>
              <S.SidebarMenuSub>
                <S.SidebarMenuSubItem>
                  <S.SidebarMenuSubButton asChild>
                    <a href="/sub">Detalhe</a>
                  </S.SidebarMenuSubButton>
                </S.SidebarMenuSubItem>
              </S.SidebarMenuSub>
            </S.SidebarMenuItem>
          </S.SidebarMenu>
        </S.SidebarGroup>
      </S.Sidebar>
      <S.SidebarTrigger />
    </S.SidebarProvider>,
  );
  expect(screen.getByRole("heading", { name: "Grupo" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
  expect(change).toHaveBeenCalledWith(false);
});
it("opens the mobile sheet through the same navigation trigger", async () => {
  vi.stubGlobal("innerWidth", 400);
  const { user } = renderUI(
    <S.SidebarProvider>
      <S.Sidebar>
        <S.SidebarContent>Menu mobile</S.SidebarContent>
      </S.Sidebar>
      <S.SidebarTrigger />
    </S.SidebarProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
  expect(screen.getByRole("dialog", { name: "Sidebar" })).toBeVisible();
  expect(screen.getByText("Menu mobile")).toBeVisible();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("requires a provider for sidebar controls", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() => renderUI(<S.SidebarTrigger />)).toThrow(
    "useSidebar must be used",
  );
});
