import { screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderUI } from "../../helpers";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
it.each([true, false])(
  "keeps panel contents and a keyboard resize separator (handle %s)",
  async (withHandle) => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.id === "left" || this.id === "right" ? 500 : 1004;
      },
    );
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.id === "right" ? 504 : this.id === "separator" ? 500 : 0;
      },
    );
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        return new DOMRect(
          this.id === "right" ? 504 : this.id === "separator" ? 500 : 0,
          0,
          this.id === "separator"
            ? 4
            : this.id === "left" || this.id === "right"
              ? 500
              : 1004,
          400,
        );
      },
    );
    const change = vi.fn();
    const { user } = renderUI(
      <ResizablePanelGroup
        orientation="horizontal"
        onLayoutChange={change}
        defaultLayout={{ left: 50, right: 50 }}
      >
        <ResizablePanel id="left" defaultSize="50%">
          Contas
        </ResizablePanel>
        <ResizableHandle id="separator" withHandle={withHandle} />
        <ResizablePanel id="right" defaultSize="50%">
          Lançamentos
        </ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByText("Contas")).toBeVisible();
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    await waitFor(() => expect(change).toHaveBeenCalled());
    separator.focus();
    await user.keyboard("{ArrowRight}");
    expect(separator).toHaveFocus();
  },
);
