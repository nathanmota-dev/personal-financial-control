import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderUI } from "../../helpers";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
it("supports expanding, collapsing and keyboard focus", async () => {
  const { user } = renderUI(
    <Accordion type="single" collapsible>
      <AccordionItem value="one">
        <AccordionTrigger>Como registrar?</AccordionTrigger>
        <AccordionContent>Use Novo lançamento.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Como excluir?</AccordionTrigger>
        <AccordionContent>Use Excluir.</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  await user.click(screen.getByRole("button", { name: "Como registrar?" }));
  expect(screen.getByText("Use Novo lançamento.")).toBeVisible();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("button", { name: "Como excluir?" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(screen.getByText("Use Excluir.")).toBeVisible();
});
