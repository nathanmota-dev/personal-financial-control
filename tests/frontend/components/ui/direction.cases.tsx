import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { DirectionProvider, useDirection } from "@/components/ui/direction";
function DirectionValue() {
  return <p>{useDirection()}</p>;
}
it("propagates direction and defaults to LTR", () => {
  const { rerender } = renderUI(<DirectionValue />);
  expect(screen.getByText("ltr")).toBeVisible();
  rerender(
    <DirectionProvider dir="rtl">
      <DirectionValue />
    </DirectionProvider>,
  );
  expect(screen.getByText("rtl")).toBeVisible();
});
