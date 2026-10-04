"use client";

import { LoginPreview } from "@/components/auth/login-preview";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft,ChevronRight } from "lucide-react";
import { useEffect,useState } from "react";

const slides = [
  { variant: "overview", title: "Tudo em uma só visão.", description: "Acompanhe receitas, despesas e investimentos. Entenda para onde seu dinheiro vai e o que fica para você." },
  { variant: "planning", title: "Menos surpresas. Mais controle.", description: "Organize lançamentos, recorrências e faturas do cartão para saber o que vem pela frente." },
  { variant: "goals", title: "Seus planos merecem um lugar.", description: "Crie metas, construa sua reserva e acompanhe cada conquista rumo ao que importa para você." },
] as const;

export function LoginArt() {
  const [viewportRef, api] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    api.on("select", update);
    api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);

  const navigate = (index: number) => api?.scrollTo(index, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const controlClass = "flex size-9 items-center justify-center rounded-full text-content transition hover:bg-surface-raised hover:text-content-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <section aria-label="Conheça os recursos do Finance" aria-roledescription="carrossel" className="flex min-w-0 flex-col justify-center border-t border-border bg-surface-elevated/60 py-10 lg:border-t-0 lg:border-l lg:py-12" onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); navigate(selected + (event.key === "ArrowRight" ? 1 : -1)); } }}>
      <div ref={viewportRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div key={slide.variant} role="group" aria-roledescription="slide" aria-label={`${index + 1} de 3: ${slide.title}`} aria-hidden={selected !== index} className="min-w-0 flex-[0_0_100%] px-6 sm:px-10 lg:px-9">
              <div className="flex min-h-[340px] items-center sm:min-h-[360px]"><LoginPreview variant={slide.variant} /></div>
              <div className="mx-auto mt-10 max-w-[350px] text-center"><h2 className="text-xl font-medium tracking-tight">{slide.title}</h2><p className="mt-3 min-h-[72px] text-sm leading-6 text-content">{slide.description}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-5">
        <button type="button" aria-label="Slide anterior" className={controlClass} onClick={() => navigate(selected - 1)}><ChevronLeft className="size-4" /></button>
        <div className="flex items-center gap-1">{slides.map((slide, index) => <button key={slide.variant} type="button" aria-label={`Ver slide ${index + 1}: ${slide.title}`} aria-current={selected === index ? "true" : undefined} onClick={() => navigate(index)} className="flex h-9 min-w-7 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-ring"><span className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${selected === index ? "w-6 bg-content-strong" : "w-1.5 bg-content-muted/40"}`} /></button>)}</div>
        <button type="button" aria-label="Próximo slide" className={controlClass} onClick={() => navigate(selected + 1)}><ChevronRight className="size-4" /></button>
      </div>
    </section>
  );
}
