import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Page from "@/app/(finance)/investments/page";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";
it("app/(finance)/investments/page presents its authorized content", async () => {
  renderUI(await Page());
  expect(requirePageSession).toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "Investimentos" })).toBeVisible();
});
