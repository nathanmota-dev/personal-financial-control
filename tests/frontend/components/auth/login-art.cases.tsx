import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useEmblaCarousel from "embla-carousel-react";
import { LoginArt } from "@/components/auth/login-art";
import { renderUI } from "../../helpers";

describe("login carousel", () => {
  const api = {
    selectedScrollSnap: vi.fn(() => 0),
    on: vi.fn(),
    off: vi.fn(),
    scrollTo: vi.fn(),
  };
  beforeEach(() => {
    vi.mocked(useEmblaCarousel).mockReturnValue([
      vi.fn(),
      api as unknown as NonNullable<ReturnType<typeof useEmblaCarousel>[1]>,
    ]);
  });
  it("moves using arrows, numbered controls and the keyboard, and cleans subscriptions", async () => {
    const { user, unmount } = renderUI(<LoginArt />);
    const carousel = screen.getByRole("region", {
      name: "Conheça os recursos do Finance",
    });
    expect(screen.getByRole("group")).toHaveAccessibleName(
      "1 de 3: Tudo em uma só visão.",
    );
    await user.click(screen.getByRole("button", { name: "Próximo slide" }));
    expect(api.scrollTo).toHaveBeenLastCalledWith(1, false);
    await user.click(screen.getByRole("button", { name: "Slide anterior" }));
    expect(api.scrollTo).toHaveBeenLastCalledWith(-1, false);
    await user.click(screen.getByRole("button", { name: /Ver slide 3/ }));
    expect(api.scrollTo).toHaveBeenLastCalledWith(2, false);
    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(api.scrollTo).toHaveBeenLastCalledWith(1, false);
    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(api.scrollTo).toHaveBeenLastCalledWith(-1, false);
    api.selectedScrollSnap.mockReturnValueOnce(1);
    act(() => api.on.mock.calls[0][1]());
    expect(screen.getByRole("button", { name: /Ver slide 2/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("group")).toHaveAccessibleName(
      "2 de 3: Menos surpresas. Mais controle.",
    );
    unmount();
    expect(api.off).toHaveBeenCalledWith("select", api.on.mock.calls[0][1]);
    expect(api.off).toHaveBeenCalledWith("reInit", api.on.mock.calls[1][1]);
  });
  it("handles an unavailable carousel API without losing the illustrative previews", () => {
    vi.mocked(useEmblaCarousel).mockReturnValue([vi.fn(), undefined]);
    renderUI(<LoginArt />);
    fireEvent.keyDown(
      screen.getByRole("region", { name: "Conheça os recursos do Finance" }),
      { key: "Enter" },
    );
    fireEvent.click(screen.getByRole("button", { name: "Próximo slide" }));
    expect(api.scrollTo).not.toHaveBeenCalled();
    expect(screen.getAllByText(/PRÉVIA ILUSTRATIVA/)).toHaveLength(3);
    expect(screen.getByText("Próxima viagem")).toBeInTheDocument();
  });
});
