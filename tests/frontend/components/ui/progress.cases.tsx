import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { Progress } from "@/components/ui/progress";
it("renders the progress fill for a known or absent value", () => {
  const { container, rerender } = renderUI(
    <Progress value={40} aria-label="Progresso" />,
  );
  expect(screen.getByRole("progressbar")).toHaveAccessibleName("Progresso");
  expect(container.querySelector("[data-slot=progress-indicator]")).toHaveStyle(
    { transform: "translateX(-60%)" },
  );
  rerender(<Progress />);
  expect(container.querySelector("[data-slot=progress-indicator]")).toHaveStyle(
    { transform: "translateX(-100%)" },
  );
});
