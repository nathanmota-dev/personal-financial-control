import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useEmblaCarousel from "embla-carousel-react";
import { LockShowcaseCarousel } from "@/components/auth/lock-showcase-carousel";
import { renderUI } from "../../helpers";

const slides = [
  { variant: "idle", title: "Bloqueio automático", description: "Trava depois do tempo sem uso." },
  { variant: "hash", title: "PIN protegido", description: "Guardado com hash." },
  { variant: "recovery", title: "Esqueceu o PIN?", description: "Entre de novo com o Google." },
] as const;
const previewLabels = { idle: "Tempo sem uso até travar", pin: "Seu PIN", stored: "Guardado", google: "Entrar com o Google", newPin: "Criar novo PIN" };
const renderCarousel = () => renderUI(<LockShowcaseCarousel label="Como o bloqueio protege você" slides={slides} previewLabels={previewLabels} />);

describe("lock showcase carousel", () => {
  const api = { selectedScrollSnap: vi.fn(() => 0), on: vi.fn(), off: vi.fn(), scrollTo: vi.fn() };
  beforeEach(() => {
    api.scrollTo.mockClear();
    vi.mocked(useEmblaCarousel).mockReturnValue([vi.fn(), api as unknown as NonNullable<ReturnType<typeof useEmblaCarousel>[1]>]);
  });
  it("shows one card per safeguard with its illustrative preview", () => {
    renderCarousel();
    expect(screen.getByRole("region", { name: "Como o bloqueio protege você" })).toBeInTheDocument();
    expect(screen.getAllByRole("group", { hidden: true }).map(slide => slide.getAttribute("aria-label"))).toEqual([
      "1 de 3: Bloqueio automático",
      "2 de 3: PIN protegido",
      "3 de 3: Esqueceu o PIN?",
    ]);
    expect(screen.getByText("5 min")).toHaveClass("bg-white");
    expect(screen.getByText("scrypt:v1:9f2c…e41a")).toBeInTheDocument();
    expect(screen.getByText("Entrar com o Google")).toBeInTheDocument();
    expect(screen.getByText("Criar novo PIN")).toBeInTheDocument();
  });
  it("navigates with the inverse controls and the keyboard", async () => {
    const { user } = renderCarousel();
    await user.click(screen.getByRole("button", { name: "Próximo slide" }));
    expect(api.scrollTo).toHaveBeenLastCalledWith(1, false);
    await user.click(screen.getByRole("button", { name: "Ver slide 3: Esqueceu o PIN?" }));
    expect(api.scrollTo).toHaveBeenLastCalledWith(2, false);
    fireEvent.keyDown(screen.getByRole("region", { name: "Como o bloqueio protege você" }), { key: "ArrowLeft" });
    expect(api.scrollTo).toHaveBeenLastCalledWith(-1, false);
    expect(screen.getByRole("button", { name: "Ver slide 1: Bloqueio automático" }).firstElementChild).toHaveClass("bg-white");
    api.selectedScrollSnap.mockReturnValueOnce(2);
    act(() => api.on.mock.calls.at(-2)?.[1]());
    expect(screen.getByRole("button", { name: "Ver slide 3: Esqueceu o PIN?" })).toHaveAttribute("aria-current", "true");
    await user.click(screen.getByRole("button", { name: "Pausar slides automáticos" }));
    expect(screen.getByRole("button", { name: "Retomar slides automáticos" })).toBeInTheDocument();
  });
});
