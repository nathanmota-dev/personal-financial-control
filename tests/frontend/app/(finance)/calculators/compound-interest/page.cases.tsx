import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Page from "@/app/(finance)/calculators/compound-interest/page";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";
it("app/(finance)/calculators/compound-interest/page presents its authorized content", async () => {
  renderUI(await Page());
  expect(requirePageSession).toHaveBeenCalled();
  expect(
    screen.getByRole("heading", { name: "Juros compostos" }),
  ).toBeVisible();
});
