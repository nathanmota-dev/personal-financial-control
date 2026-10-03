import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
it.each(["default", "line"] as const)(
  "switches visible panels with the %s variant",
  async (variant) => {
    const change = vi.fn();
    const { user } = renderUI(
      <Tabs defaultValue="month" onValueChange={change}>
        <TabsList variant={variant}>
          <TabsTrigger value="month">Mensal</TabsTrigger>
          <TabsTrigger value="year">Anual</TabsTrigger>
          <TabsTrigger value="closed" disabled>
            Indisponível
          </TabsTrigger>
        </TabsList>
        <TabsContent value="month">Resumo do mês</TabsContent>
        <TabsContent value="year">Resumo do ano</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Resumo do mês");
    await user.click(screen.getByRole("tab", { name: "Anual" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Resumo do ano");
    expect(change).toHaveBeenCalledWith("year");
    expect(screen.getByRole("tab", { name: "Indisponível" })).toBeDisabled();
  },
);
