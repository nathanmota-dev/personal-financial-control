import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
it.each([undefined, "outline"] as const)(
  "selects a filter and inherits group styling (%s)",
  async (variant) => {
    const change = vi.fn();
    const { user } = renderUI(
      <ToggleGroup
        type="single"
        variant={variant}
        size="sm"
        orientation="vertical"
        spacing={2}
        onValueChange={change}
      >
        <ToggleGroupItem value="income">Receitas</ToggleGroupItem>
        <ToggleGroupItem value="expense">Despesas</ToggleGroupItem>
      </ToggleGroup>,
    );
    await user.click(screen.getByRole("radio", { name: "Despesas" }));
    expect(change).toHaveBeenCalledWith("expense");
    expect(screen.getByRole("radio", { name: "Despesas" })).toHaveAttribute(
      "data-size",
      "sm",
    );
  },
);
