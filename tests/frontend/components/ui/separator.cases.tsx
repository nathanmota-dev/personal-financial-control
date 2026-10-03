import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { Separator } from "@/components/ui/separator";
it("supports horizontal and vertical accessible separators", () => {
  const { rerender } = renderUI(<Separator decorative={false} />);
  expect(screen.getByRole("separator")).not.toHaveAttribute(
    "aria-orientation",
    "vertical",
  );
  rerender(<Separator decorative={false} orientation="vertical" />);
  expect(screen.getByRole("separator")).toHaveAttribute(
    "aria-orientation",
    "vertical",
  );
});
