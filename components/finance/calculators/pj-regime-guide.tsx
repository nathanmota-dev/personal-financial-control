import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export function PjRegimeGuide() {
  return <section aria-label="Entenda os regimes" className="grid gap-4 md:grid-cols-3">{[
    ["MEI", "Até R$ 81 mil/ano. DAS fixo conforme a atividade. Nem toda ocupação é permitida."],
    ["Simples Nacional", "Até R$ 4,8 milhões/ano. DAS progressivo pelos Anexos I a V; anexo e fator R dependem da atividade e folha. Existem tributos fora do DAS."],
    ["Lucro Presumido", "Até R$ 78 milhões/ano, sujeito à elegibilidade. Tributos separados sobre receita e bases presumidas. ISS depende do município; ICMS/IPI dependem da atividade."],
  ].map(([title, description]) => <Card key={title} className="shadow-none"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="text-sm text-content">{description}</CardContent></Card>)}</section>;
}
