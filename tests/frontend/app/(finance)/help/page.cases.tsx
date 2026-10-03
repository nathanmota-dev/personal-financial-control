import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Page from "@/app/(finance)/help/page";
import { renderUI } from "@/tests/frontend/helpers";
it("app/(finance)/help/page presents its authorized content", async () => {
  renderUI(await Page());
  expect(
    screen.getByRole("heading", { name: "Como usar o Finance" }),
  ).toBeVisible();
});
