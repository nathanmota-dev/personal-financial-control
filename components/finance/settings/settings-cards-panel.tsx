"use client";

import { useRef, useState } from "react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import type { SettingsCardsPanelProps } from "@/lib/interfaces/settings";

import { SettingsCardForm } from "./settings-card-form";
import { SettingsCardTile } from "./settings-card-tile";

export function SettingsCardsPanel({ cards }: SettingsCardsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const editing = cards.find((card) => card.id === editingId) ?? null;
  const sorted = [...cards].sort((left, right) => Number(left.isArchived) - Number(right.isArchived) || left.name.localeCompare(right.name, "pt-BR"));
  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <div ref={formRef} className="scroll-mt-6">
        <SettingsCardForm key={editing?.id ?? "new"} card={editing} onDone={() => setEditingId(null)} />
      </div>
      <section aria-label="Seus cartões" className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
        <DashboardCardIllustration src="/images/credit-card-cards.webp" />
        <h2 className="text-lg font-semibold leading-[25px]">Seus cartões</h2>
        <p className="mt-1 pr-16 text-xs text-content-muted">Cartões de crédito usados em compras, parcelas e faturas</p>
        {cards.length ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((card) => (
              <SettingsCardTile
                key={card.id}
                card={card}
                editing={card.id === editingId}
                onEdit={() => {
                  setEditingId(card.id);
                  formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
            ))}
          </ul>
        ) : (
          <div className="mt-4"><FinanceEmptyState title="Nenhum cartão cadastrado" description="Use o formulário acima para cadastrar o primeiro cartão." /></div>
        )}
      </section>
    </div>
  );
}
