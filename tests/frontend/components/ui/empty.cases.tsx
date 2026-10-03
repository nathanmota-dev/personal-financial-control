import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
it("shows the empty-state message and an action with optional media", async () => {
  const click = vi.fn();
  const { user, rerender } = renderUI(
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <span>+</span>
        </EmptyMedia>
        <EmptyTitle>Sem contas</EmptyTitle>
        <EmptyDescription>Cadastre uma conta</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <button onClick={click}>Criar</button>
      </EmptyContent>
    </Empty>,
  );
  expect(screen.getByText("Cadastre uma conta")).toBeVisible();
  await user.click(screen.getByRole("button"));
  expect(click).toHaveBeenCalledOnce();
  rerender(
    <Empty>
      <EmptyMedia>Ícone</EmptyMedia>
    </Empty>,
  );
  expect(screen.getByText("Ícone")).toHaveAttribute("data-variant", "default");
});
