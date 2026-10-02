import { isDemoMode } from "@/lib/demo/mode";
import type { LoginPageProps } from "@/lib/interfaces/auth";
import { LoginForm } from "@/components/auth/login-form";
import { LoginArt } from "@/components/auth/login-art";
import { safeDestination } from "@/lib/auth/config";
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const demoMode = isDemoMode();
  return <main className="flex min-h-screen items-center justify-center bg-surface p-5 md:p-12"><div className="grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-brand/20 bg-surface-raised shadow-2xl md:grid-cols-2"><section className="flex flex-col justify-center px-8 py-14 md:px-14"><p className="mb-16 text-xs font-semibold uppercase tracking-[.28em] text-brand">Controle Financeiro</p><p className="mb-4 text-sm text-content-muted">Seu espaço pessoal</p><h1 className="font-heading text-4xl leading-tight md:text-5xl">Clareza para cuidar<br/>do seu dinheiro.</h1><p className="mt-6 max-w-sm leading-relaxed text-content">{demoMode ? "Explore a demonstração sem login, com dados fictícios e alterações temporárias compartilhadas nesta instância. Não insira dados pessoais." : "Entre com sua conta Google para acompanhar suas finanças e planejar os próximos passos."}</p><LoginForm destination={safeDestination(params.next)} demoMode={demoMode}/><p className="mt-8 text-xs text-content-muted">{demoMode ? "Demo pública • Nenhuma conta Google necessária." : "Acesso exclusivo à sua conta autorizada."}</p></section><LoginArt/></div></main>;
}
