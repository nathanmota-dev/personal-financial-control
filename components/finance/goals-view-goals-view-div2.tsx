"use client";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import {
AllocationBreakdownCard,
GoalArchiveCard,
GoalCardItem,
MonthlyEvolutionCard
} from "@/components/finance/goals/components";
import { Button } from "@/components/ui/button";
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/ui/tabs";
import type { GoalsViewDiv2Props } from "@/lib/interfaces/render/goals-view-goals-view-div2";
import {
Plus
} from "lucide-react";

export function GoalsViewDiv2({ dashboard, openAllocationDialog, openContributionDialog, openEditGoal, setArchiveGoal, canCreateContribution, isMutating, openCreateGoal }: GoalsViewDiv2Props) {
  return (
<div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <Tabs defaultValue="active" className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-content-strong">
                  Carteira por objetivo
                </h2>
                <p className="text-sm text-content">
                  {dashboard.summary.goalCount} metas ativas ou pausadas
                </p>
              </div>
              <TabsList className="border border-border bg-card text-content">
                <TabsTrigger value="active">Atuais</TabsTrigger>
                <TabsTrigger value="archived">
                  Arquivadas ({dashboard.summary.archivedGoalCount})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="active" className="mt-4">
              {dashboard.goals.length ? (
                <div className="grid gap-4 md:grid-cols-2">
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

            <TabsContent value="archived" className="mt-4">
              {dashboard.archivedGoals.length ? (
                <div className="grid gap-4 md:grid-cols-2">
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
          </Tabs>

          <div className="grid min-w-0 gap-6 md:grid-cols-2 2xl:grid-cols-1">
            <AllocationBreakdownCard dashboard={dashboard} />
            <MonthlyEvolutionCard dashboard={dashboard} />
          </div>
        </div>
  );
}
