import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { UserControls } from "@/components/auth/user-controls";
it.each([
  [true, true, "Visitante demo", "VD"],
  [true, false, "Ana Lima", "AL"],
  [false, true, "Ana", "A"],
  [false, false, "", "U"],
] as const)(
  "displays account identity (expanded %s, demo %s)",
  async (expanded, demoMode, name, initials) => {
    const { user } = renderUI(
      <UserControls
        user={{ name, photoURL: null }}
        demoMode={demoMode}
        expanded={expanded}
      />,
    );
    expect(await screen.findByText(initials)).toBeVisible();
    if (expanded) {
      await user.click(
        screen.getByRole("button", { name: "Abrir preferências da conta" }),
      );
      expect(screen.getByText("Tema")).toBeVisible();
    }
    expect(screen.queryByRole("button", { name: /Sair/ })).toEqual(
      demoMode ? null : expect.any(HTMLElement),
    );
  },
);
