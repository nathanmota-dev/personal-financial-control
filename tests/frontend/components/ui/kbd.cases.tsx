import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
it("presents a grouped keyboard shortcut", () => {
  renderUI(
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>,
  );
  expect(screen.getByText("Ctrl").tagName).toBe("KBD");
  expect(screen.getByText("K")).toBeVisible();
});
