import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import { Badge } from "@/components/ui/badge";
it("supports status variants and an actionable child", () => {
  const { rerender } = renderUI(<Badge>Ativo</Badge>);
  expect(screen.getByText("Ativo")).toHaveAttribute("data-slot", "badge");
  rerender(
    <Badge asChild variant="outline">
      <a href="/goals">Meta</a>
    </Badge>,
  );
  expect(screen.getByRole("link")).toHaveAttribute("href", "/goals");
});
