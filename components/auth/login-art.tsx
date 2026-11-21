"use client";

import { CarouselControls } from "@/components/auth/carousel-controls";
import { LoginPreview } from "@/components/auth/login-preview";
import { useAutoCarousel } from "@/hooks/use-auto-carousel";

const slides = [
  { variant: "overview", title: "Tudo em uma só visão.", description: "Acompanhe receitas, despesas e investimentos. Entenda para onde seu dinheiro vai e o que fica para você." },
  { variant: "planning", title: "Menos surpresas. Mais controle.", description: "Organize lançamentos, recorrências e faturas do cartão para saber o que vem pela frente." },
  { variant: "goals", title: "Seus planos merecem um lugar.", description: "Crie metas, construa sua reserva e acompanhe cada conquista rumo ao que importa para você." },
] as const;
const titles = slides.map(slide => slide.title);

export function LoginArt() {
  const { viewportRef, selected, paused, navigate, togglePause, regionProps } = useAutoCarousel(slides.length);

  return (
    <section {...regionProps} aria-label="Conheça os recursos do Finance" aria-roledescription="carrossel" className="flex min-w-0 flex-col justify-center border-t border-border bg-surface-elevated/60 py-10 lg:border-t-0 lg:border-l lg:py-12">
      <div ref={viewportRef} className="overflow-hidden py-3">
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <div key={slide.variant} role="group" aria-roledescription="slide" aria-label={`${index + 1} de 3: ${slide.title}`} aria-hidden={selected !== index} className="min-w-0 flex-[0_0_100%] px-6 sm:px-10 lg:px-9">
              <div className="flex min-h-[340px] items-center sm:min-h-[360px]"><LoginPreview variant={slide.variant} /></div>
              <div className="mx-auto mt-10 max-w-[350px] text-center"><h2 className="text-xl font-medium tracking-tight">{slide.title}</h2><p className="mt-3 min-h-[72px] text-sm leading-6 text-content">{slide.description}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6"><CarouselControls titles={titles} selected={selected} paused={paused} onNavigate={navigate} onTogglePause={togglePause} /></div>
    </section>
  );
}
