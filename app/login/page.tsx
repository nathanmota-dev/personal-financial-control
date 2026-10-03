import { ChartPie, LockKeyhole } from "lucide-react";
import { isDemoMode } from "@/lib/demo/mode";
import type { LoginPageProps } from "@/lib/interfaces/auth";
import { LoginForm } from "@/components/auth/login-form";
import { LoginArt } from "@/components/auth/login-art";
import { ThemeToggle } from "@/components/finance/theme-toggle";
import { safeDestination } from "@/lib/auth/config";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const demoMode = isDemoMode();

  return (
    <main className="flex min-h-svh items-center justify-center bg-surface p-4 sm:p-8 lg:p-12">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-border bg-surface-raised shadow-xl shadow-black/5 lg:min-h-[680px] lg:grid-cols-2">
        <section className="relative flex flex-col px-7 py-7 sm:px-12 sm:py-9 lg:px-16">
          <header className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"><span className="flex size-8 items-center justify-center rounded-lg bg-orange text-white"><ChartPie className="size-5" aria-hidden="true" /></span>finance</span>
            <ThemeToggle />
          </header>
          <div className="mx-auto flex w-full max-w-[340px] flex-1 flex-col justify-center py-16 text-center lg:py-20">
            <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.04em] sm:text-[34px]">Seu dinheiro.<br />Uma visão mais clara.</h1>
            <p className="mt-5 text-sm leading-6 text-content">{demoMode ? "Explore a demonstração com dados fictícios e alterações temporárias compartilhadas. Não insira dados pessoais." : "Tudo o que você precisa para acompanhar suas finanças e dar espaço aos seus planos."}</p>
            <LoginForm destination={safeDestination(params.next)} demoMode={demoMode} />
            <p className="mt-5 text-xs leading-5 text-content-muted">{demoMode ? "Demo pública. Nenhuma conta Google necessária." : "Entre com sua conta Google para começar."}</p>
          </div>
          <p className="flex items-center justify-center gap-2 text-center text-xs text-content-muted"><LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />{demoMode ? "Uma prévia do seu próximo passo." : "Seu espaço pessoal. Acesso somente a contas autorizadas."}</p>
        </section>
        <LoginArt />
      </div>
    </main>
  );
}
