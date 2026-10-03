import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { HelpView } from "@/components/finance/help/help-view";
import { helpGuides, helpQuestions, helpSteps } from "@/lib/help-content";
import { renderUI } from "../../../helpers";

it("presents every guide, first step and expandable answer", async () => {
  const { user } = renderUI(<HelpView />);
  expect(
    screen.getByRole("heading", { name: "Como usar o Finance" }),
  ).toBeVisible();
  for (const guide of helpGuides)
    expect(
      screen.getByRole("link", { name: `${guide.title} ${guide.description}` }),
    ).toHaveAttribute("href", guide.href);
  for (const step of helpSteps)
    expect(screen.getByRole("link", { name: step.linkLabel })).toHaveAttribute(
      "href",
      step.href,
    );
  for (const item of helpQuestions) {
    const question = screen.getByText(item.question);
    expect(question.parentElement).not.toHaveAttribute("open");
    await user.click(question);
    expect(question.parentElement).toHaveAttribute("open");
    expect(screen.getByText(item.answer)).toBeVisible();
    await user.click(question);
    expect(question.parentElement).not.toHaveAttribute("open");
  }
});
