import { ArrowRight,ArrowUpRight,ChevronDown } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/finance/page-header";
import { helpGuides,helpQuestions,helpSteps } from "@/lib/help-content";

export function HelpView() {
  return (
    <div className="space-y-8 pb-4">
      <PageHeader
        title="Como usar o Finance"
        description="Um guia para organizar seu dinheiro, entender cada tela e aproveitar o app no dia a dia."
      />

      <section
        aria-labelledby="help-start-title"
        className="overflow-hidden rounded-[20px] border border-border bg-card"
      >
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <h2 id="help-start-title" className="text-xl font-semibold leading-6 text-content-strong">
            Sua organização começa aqui
          </h2>
          <p className="mt-1 text-[13px] leading-4 text-content-muted">Primeiros passos</p>
        </div>
        <ol className="grid md:grid-cols-3">
          {helpSteps.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col border-b border-border p-5 last:border-b-0 sm:p-6 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <span aria-hidden="true" className="text-3xl font-light tracking-tight text-content-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-base font-semibold text-content-strong">{step.title}</h3>
              <p className="mb-5 mt-2 text-sm leading-6 text-content">{step.description}</p>
              <Link
                href={step.href}
                className="mt-auto inline-flex w-fit items-center gap-2 rounded-sm text-xs font-medium text-brand transition-colors hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {step.linkLabel}
                <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="help-guide-title">
        <div className="mb-5">
          <h2 id="help-guide-title" className="text-xl font-semibold tracking-tight text-content-strong">
            Conheça cada área
          </h2>
          <p className="mt-1 text-sm text-content">Entenda o que fazer em cada tela e acesse quando precisar.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {helpGuides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link
                key={guide.href}
                href={guide.href}
                className="group rounded-[20px] border border-border bg-card p-5 transition-colors hover:border-brand/40 hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-brand-soft text-brand">
                    <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.7} />
                  </span>
                  <h3 className="text-sm font-semibold text-content-strong">{guide.title}</h3>
                  <ArrowUpRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-content-muted transition-colors group-hover:text-brand" />
                </div>
                <p className="mt-4 text-sm leading-6 text-content">{guide.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="help-faq-title">
        <h2 id="help-faq-title" className="mb-5 text-xl font-semibold tracking-tight text-content-strong">
          Dúvidas frequentes
        </h2>
        <div className="divide-y divide-border overflow-hidden rounded-[20px] border border-border bg-card">
          {helpQuestions.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-sm font-medium text-content-strong transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-content-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" />
              </summary>
              <p className="max-w-3xl px-5 pb-5 text-sm leading-6 text-content sm:px-6">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
