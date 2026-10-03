import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
it("composes the card content, actions and compact size", () => {
  const { rerender } = renderUI(
    <Card>
      <CardHeader>
        <CardTitle>Conta</CardTitle>
        <CardDescription>Saldo disponível</CardDescription>
        <CardAction>
          <button>Abrir</button>
        </CardAction>
      </CardHeader>
      <CardContent>R$ 100,00</CardContent>
      <CardFooter>Atualizado hoje</CardFooter>
    </Card>,
  );
  expect(screen.getByText("R$ 100,00")).toBeVisible();
  expect(screen.getByRole("button")).toHaveAccessibleName("Abrir");
  expect(screen.getByText("Atualizado hoje")).toBeVisible();
  rerender(
    <Card size="sm">
      <CardContent>Pequeno</CardContent>
    </Card>,
  );
  expect(screen.getByText("Pequeno").parentElement).toHaveAttribute(
    "data-size",
    "sm",
  );
});
