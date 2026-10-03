import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { AspectRatio } from "@/components/ui/aspect-ratio";
it("contains media at the requested ratio", () => {
  const { container } = renderUI(
    <AspectRatio ratio={16 / 9}>
      <div role="img" aria-label="Finance" />
    </AspectRatio>,
  );
  expect(screen.getByRole("img")).toHaveAccessibleName("Finance");
  expect(
    container.querySelector("[data-radix-aspect-ratio-wrapper]"),
  ).toHaveStyle({ paddingBottom: "56.25%" });
});
