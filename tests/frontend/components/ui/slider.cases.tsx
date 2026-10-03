import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import { Slider } from "@/components/ui/slider";
it("adjusts a value with the keyboard and reports the change", async () => {
  const change = vi.fn();
  const { user, rerender } = renderUI(
    <Slider
      defaultValue={[20]}
      min={0}
      max={100}
      step={5}
      onValueChange={change}
    />,
  );
  const slider = screen.getByRole("slider");
  slider.focus();
  await user.keyboard("{ArrowRight}");
  expect(slider).toHaveAttribute("aria-valuenow", "25");
  expect(change).toHaveBeenLastCalledWith([25]);
  rerender(<Slider key="controlled" value={[10, 30]} min={0} max={50} />);
  expect(screen.getAllByRole("slider")).toHaveLength(2);
  rerender(<Slider key="range" defaultValue={[0, 50]} min={0} max={50} />);
  expect(screen.getAllByRole("slider")).toHaveLength(2);
});
