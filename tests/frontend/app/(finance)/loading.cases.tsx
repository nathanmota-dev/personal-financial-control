import { expect, it } from "vitest";
import Loading from "@/app/(finance)/loading";
import { renderUI } from "@/tests/frontend/helpers";
it("renders placeholders for the dashboard metrics and charts", () => {
  const { container } = renderUI(<Loading />);
  expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(9);
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
    20,
  );
});
