import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "@/components/ui/alert";
it("announces the title and description and retains an action", async () => {
  const onClick = vi.fn();
  const { user } = renderUI(
    <Alert variant="destructive">
      <AlertTitle>Falha</AlertTitle>
      <AlertDescription>Confira o saldo</AlertDescription>
      <AlertAction>
        <button onClick={onClick}>Tentar novamente</button>
      </AlertAction>
    </Alert>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("FalhaConfira o saldo");
  await user.click(screen.getByRole("button"));
  expect(onClick).toHaveBeenCalledOnce();
});
