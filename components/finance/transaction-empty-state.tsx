"use client";
import { Search } from "lucide-react";

export function TransactionEmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-surface-raised text-content-subtle">
        <Search className="size-5" />
      </div>
      <p className="mt-4 font-medium text-content-strong">{query ? "Nenhum resultado encontrado" : "Nenhum lançamento nesta fatura"}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-content">
        {query ? "Tente buscar por outro nome ou remova o filtro de categoria." : "Quando houver compras ou parcelas no mês selecionado, elas aparecerão aqui."}
      </p>
    </div>
  );
}
