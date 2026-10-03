import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { Button } from "@/components/ui/button";
it("forwards clicks, disabled state and link composition", async () => {
  const onClick = vi.fn();
  const { user, rerender } = renderUI(
    <Button onClick={onClick}>Salvar</Button>,
  );
  await user.click(screen.getByRole("button", { name: "Salvar" }));
  expect(onClick).toHaveBeenCalledOnce();
  rerender(
    <Button disabled onClick={onClick}>
      Salvar
    </Button>,
  );
  await user.click(screen.getByRole("button"));
  expect(onClick).toHaveBeenCalledOnce();
  rerender(
    <Button asChild variant="outline" size="sm">
      <a href="/goals">Metas</a>
    </Button>,
  );
  expect(screen.getByRole("link")).toHaveAttribute("href", "/goals");
});
