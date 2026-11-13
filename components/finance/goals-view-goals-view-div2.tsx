"use client";

import { Plus } from "lucide-react";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import {
  GoalArchiveCard,
  GoalCardItem,
} from "@/components/finance/goals/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GoalsViewDiv2Props } from "@/lib/interfaces/render/goals-view-goals-view-div2";

export function GoalsViewDiv2({ dashboard, openAllocationDialog, openContributionDialog, openEditGoal, setArchiveGoal, canCreateContribution, isMutating, openCreateGoal }: GoalsViewDiv2Props) {
  return (
    <Tabs defaultValue="active" className="min-w-0 gap-0">
      <section aria-label="Carteira por objetivo" className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold leading-[25px]">Carteira por objetivo</h2>
              <Badge variant="outline" className="border-input text-content">{dashboard.summary.goalCount}</Badge>
            </div>
            <p className="mt-1 text-xs text-content-muted">{`${dashboard.summary.goalCount} metas ativas ou pausadas`}</p>
          </div>
          <TabsList variant="line">
            <TabsTrigger value="active">Atuais</TabsTrigger>
            <TabsTrigger value="archived">
              Arquivadas ({dashboard.summary.archivedGoalCount})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active" className="mt-5">
          {dashboard.goals.length ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {dashboard.goals.map((goal) => (
                <GoalCardItem
                  key={goal.id}
                  goal={goal}
                  onAllocate={() => openAllocationDialog(goal, "manual_allocation")}
                  onRelease={() => openAllocationDialog(goal, "manual_release")}
                  onContribute={() => openContributionDialog(goal)}
                  onEdit={() => openEditGoal(goal)}
                  onArchive={() => setArchiveGoal(goal)}
                  canContribute={canCreateContribution}
                />
              ))}
            </div>
          ) : (
            <FinanceEmptyState
              title="Nenhuma meta cadastrada"
              description="Crie uma meta para separar parte da carteira sem mexer na reserva livre."
              action={
                <Button type="button" disabled={isMutating} onClick={openCreateGoal}>
                  <Plus className="size-4" />
                  Nova meta
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-5">
          {dashboard.archivedGoals.length ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {dashboard.archivedGoals.map((goal) => (
                <GoalArchiveCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <FinanceEmptyState
              title="Sem metas arquivadas"
              description="Metas arquivadas deixam de compor a reserva livre e continuam disponíveis para referência."
            />
          )}
        </TabsContent>
      </section>
    </Tabs>
  );
}
