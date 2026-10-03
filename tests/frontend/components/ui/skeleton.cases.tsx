import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { Skeleton } from "@/components/ui/skeleton";
it("exposes a labelled loading placeholder with caller dimensions", () => {
  renderUI(
    <Skeleton role="status" aria-label="Carregando saldo" className="h-8" />,
  );
  expect(screen.getByRole("status")).toHaveClass("h-8", "animate-pulse");
});
