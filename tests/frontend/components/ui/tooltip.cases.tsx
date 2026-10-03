import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
it("explains an icon button on hover and dismisses on Escape", async () => {
  const { user } = renderUI(
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button>?</button>
        </TooltipTrigger>
        <TooltipContent>Explicação do saldo</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  await user.hover(screen.getByRole("button", { name: "?" }));
  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    "Explicação do saldo",
  );
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("tooltip")).toBeNull();
});
