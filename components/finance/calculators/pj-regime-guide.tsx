import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { CALCULATOR_ILLUSTRATIONS } from "@/lib/calculator-illustrations";

const regimes = [
  ["MEI", "Até R$ 81 mil/ano", "DAS fixo conforme a atividade. Nem toda ocupação é permitida."],
  ["Simples Nacional", "Até R$ 4,8 milhões/ano", "DAS progressivo pelos Anexos I a V; anexo e fator R dependem da atividade e folha. Existem tributos fora do DAS."],
  ["Lucro Presumido", "Até R$ 78 milhões/ano", "Sujeito à elegibilidade. Tributos separados sobre receita e bases presumidas. ISS depende do município; ICMS/IPI dependem da atividade."],
] as const;

export function PjRegimeGuide() {
  return <section aria-label="Entenda os regimes" className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
    <DashboardCardIllustration src={CALCULATOR_ILLUSTRATIONS.regimes} />
    <h2 className="text-lg font-semibold leading-[25px] text-content-strong">Entenda os regimes</h2>
    <p className="mt-1 pr-20 text-xs text-content-muted">Limites de faturamento e como cada regime tributa a receita.</p>
    <ul className="mt-5 grid gap-3 md:grid-cols-3">{regimes.map(([title, limit, description]) => <li key={title} className="min-w-0 rounded-[14px] border border-border p-4">
      <p className="text-[10px] font-bold tracking-wider text-content uppercase">{limit}</p>
      <h3 className="mt-2 text-[15px] font-semibold text-content-strong">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-content">{description}</p>
    </li>)}</ul>
  </section>;
}
