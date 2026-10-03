import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
it("preserves readable content and both scrollbar orientations", () => {
  const { container } = renderUI(
    <ScrollArea type="always">
      <p>Histórico completo</p>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>,
  );
  expect(screen.getByText("Histórico completo")).toBeVisible();
  expect(
    container.querySelector('[data-slot="scroll-area-viewport"]'),
  ).toContainElement(screen.getByText("Histórico completo"));
  expect(
    container.querySelector('[data-orientation="horizontal"]'),
  ).toBeInTheDocument();
});
