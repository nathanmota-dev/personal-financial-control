import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { Label } from "@/components/ui/label";
it("labels the associated form control", () => {
  renderUI(
    <>
      <Label htmlFor="name">Nome</Label>
      <input id="name" />
    </>,
  );
  expect(screen.getByLabelText("Nome")).toBeVisible();
});
