import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import useEmblaCarousel from "embla-carousel-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { renderUI } from "../../helpers";
it.each(["horizontal", "vertical"] as const)(
  "moves %s slides, announces navigation and cleans subscriptions",
  async (orientation) => {
    const api = {
      canScrollPrev: vi.fn(() => true),
      canScrollNext: vi.fn(() => true),
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };
    vi.mocked(useEmblaCarousel).mockReturnValue([vi.fn(), api as never]);
    const setApi = vi.fn();
    const { user, unmount } = renderUI(
      <Carousel orientation={orientation} setApi={setApi} aria-label="Faturas">
        <CarouselContent>
          <CarouselItem>Julho</CarouselItem>
          <CarouselItem>Agosto</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Next slide" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    fireEvent.keyDown(screen.getByRole("region", { name: "Faturas" }), {
      key: "ArrowLeft",
    });
    fireEvent.keyDown(screen.getByRole("region", { name: "Faturas" }), {
      key: "ArrowRight",
    });
    fireEvent.keyDown(screen.getByRole("region", { name: "Faturas" }), {
      key: "Enter",
    });
    expect(api.scrollNext).toHaveBeenCalledTimes(2);
    expect(api.scrollPrev).toHaveBeenCalledTimes(2);
    expect(setApi).toHaveBeenCalledWith(api);
    api.canScrollNext.mockReturnValue(false);
    act(() => api.on.mock.calls[1][1](api));
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
    unmount();
    expect(api.off).toHaveBeenCalledTimes(2);
  },
);
it("keeps navigation disabled until the carousel API is ready", () => {
  vi.mocked(useEmblaCarousel).mockReturnValue([vi.fn(), undefined]);
  renderUI(
    <Carousel>
      <CarouselContent>
        <CarouselItem>Primeiro</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>,
  );
  expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
  fireEvent.keyDown(screen.getByRole("region", { name: "" }), {
    key: "ArrowRight",
  });
});
it("requires the carousel context for slides", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() => renderUI(<CarouselItem />)).toThrow("useCarousel must be used");
});
