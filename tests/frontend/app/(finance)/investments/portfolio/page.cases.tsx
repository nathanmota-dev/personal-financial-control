import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Page from "@/app/(finance)/investments/portfolio/page";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";
it("app/(finance)/investments/portfolio/page presents its authorized content", async () => {
  renderUI(await Page());
  expect(requirePageSession).toHaveBeenCalled();
  expect(
    screen.getByRole("heading", { name: "Carteira de longo prazo" }),
  ).toBeVisible();
});
