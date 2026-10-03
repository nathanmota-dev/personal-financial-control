import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import { renderToString } from "react-dom/server";
it("switches between light and dark themes", async () => {
  const { user } = renderUI(<ThemeToggle />);
  await user.click(screen.getByRole("button", { name: "Ativar tema escuro" }));
  expect(document.documentElement).toHaveClass("dark");
  await user.click(screen.getByRole("button", { name: "Ativar tema claro" }));
  expect(document.documentElement).toHaveClass("light");
  expect(localStorage.getItem("theme")).toBe("light");
});
it("disables the toggle before hydration", () => {
  expect(renderToString(<ThemeToggle />)).toContain("disabled");
});
