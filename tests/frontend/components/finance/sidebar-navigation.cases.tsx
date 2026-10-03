import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { SidebarNavigation } from "@/components/finance/sidebar-navigation";
import { navigation } from "../../setup";
it.each([true, false])(
  "filters page search and retains the competence month (mobile %s)",
  async (mobile) => {
    navigation.pathname = "/investments/portfolio";
    navigation.search = new URLSearchParams("month=2026-08");
    const { user } = renderUI(<SidebarNavigation mobile={mobile} />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard?month=2026-08",
    );
    expect(
      screen.getByRole("link", { name: "Carteira de longo prazo" }),
    ).toHaveAttribute("aria-current", "page");
    await user.type(
      screen.getByRole("textbox", { name: "Buscar páginas" }),
      "reserva",
    );
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Reserva de emergência" }),
    ).toBeVisible();
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "zzzzz");
    expect(screen.queryByRole("link")).toBeNull();
  },
);
