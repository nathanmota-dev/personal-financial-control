import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
} from "@/components/ui/navigation-menu";
it.each([true, false])(
  "opens navigation destinations (viewport %s)",
  async (viewport) => {
    const { user } = renderUI(
      <NavigationMenu viewport={viewport} delayDuration={0}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Investimentos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/investments/portfolio">
                Carteira
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuIndicator />
      </NavigationMenu>,
    );
    screen.getByRole("button", { name: "Investimentos" }).focus();
    await user.keyboard("{Enter}");
    expect(
      await screen.findByRole("link", { name: "Carteira" }),
    ).toHaveAttribute("href", "/investments/portfolio");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("link", { name: "Carteira" })).toBeNull();
  },
);
