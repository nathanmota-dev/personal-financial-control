import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
it("opens and closes its content and reports state", async () => {
  const change = vi.fn();
  const { user } = renderUI(
    <Collapsible onOpenChange={change}>
      <CollapsibleTrigger>Detalhes</CollapsibleTrigger>
      <CollapsibleContent>Saldo R$ 100,00</CollapsibleContent>
    </Collapsible>,
  );
  expect(screen.queryByText("Saldo R$ 100,00")).toBeNull();
  await user.click(screen.getByRole("button"));
  expect(screen.getByText("Saldo R$ 100,00")).toBeVisible();
  expect(change).toHaveBeenCalledWith(true);
  await user.click(screen.getByRole("button"));
  expect(screen.queryByText("Saldo R$ 100,00")).toBeNull();
});
