import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import ErrorPage from "@/app/(finance)/error";
import { renderUI } from "@/tests/frontend/helpers";
it("offers a retry after a financial view fails", async () => {
  const retry = vi.fn();
  const { user } = renderUI(
    <ErrorPage error={new Error("offline")} retry={retry} />,
  );
  await user.click(screen.getByRole("button"));
  expect(retry).toHaveBeenCalledOnce();
});
