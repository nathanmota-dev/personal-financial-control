import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { Spinner } from "@/components/ui/spinner";
it("announces loading and accepts an application label", () => {
  const { rerender } = renderUI(<Spinner />);
  expect(screen.getByRole("status", { name: "Carregando" })).toBeVisible();
  rerender(<Spinner aria-label="Salvando registro" />);
  expect(
    screen.getByRole("status", { name: "Salvando registro" }),
  ).toBeVisible();
});
