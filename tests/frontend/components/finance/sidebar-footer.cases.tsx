import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { SidebarFooter } from "@/components/finance/sidebar-footer";
import { navigation } from "../../setup";
it.each(["/settings", "/help", "/dashboard"])(
  "marks the current footer destination %s",
  (pathname) => {
    navigation.pathname = pathname;
    renderUI(
      <SidebarFooter user={{ name: "Visitante", photoURL: null }} demoMode />,
    );
    for (const [label, href] of [
      ["Ajuda", "/help"],
      ["Configurações", "/settings"],
    ]) {
      const link = screen.getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", href);
      if (href === pathname)
        expect(link).toHaveAttribute("aria-current", "page");
      else expect(link).not.toHaveAttribute("aria-current");
    }
  },
);
