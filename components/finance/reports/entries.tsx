import Link from "next/link";
import { formatCurrency, transactionTypeLabels } from "@/lib/finance-ui";
import type { TransactionType } from "@/lib/db/schema";
import type { ReportProps } from "@/lib/interfaces/reports";

export function ReportEntries({ report }: ReportProps) {
  return <section className="rounded-2xl bg-card p-5"><h2 className="text-lg font-semibold">Origens dos totais</h2>
    <p className="my-3 text-sm text-content">Todos os lançamentos e parcelas incluídos no período. Consulte a origem para editar ou conferir a fatura.</p>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Competência", "Descrição", "Tipo", "Categoria", "Conta", "Situação", "Valor", "Origem"].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead>
      <tbody>{report.entries.map((row) => <tr className="border-t" key={`${row.source}-${row.id}`}><td className="p-3">{row.month}</td><th className="p-3 font-normal">{row.description}</th><td className="p-3">{transactionTypeLabels[row.type as TransactionType]}</td><td className="p-3">{row.category}</td><td className="p-3">{row.account}</td><td className="p-3">{row.status === "pending" ? "Pendente" : row.source === "installment" ? "Parcela por competência" : "Efetivado"}</td><td className="whitespace-nowrap p-3">{formatCurrency(row.amountCents)}</td><td className="p-3"><Link className="text-brand underline" href={`/${row.source === "installment" ? "credit-card" : "transactions"}?month=${row.month}`}>{row.source === "installment" ? "Parcela de cartão" : "Lançamento"}</Link></td></tr>)}</tbody>
    </table></div>
  </section>;
}
