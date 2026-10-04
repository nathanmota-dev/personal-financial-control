"use client";

import { useGoalsView } from "@/hooks/finance/use-goals-view";
import {
ArrowRight,
Plus
} from "lucide-react";
import Link from "next/link";
import { GoalsViewDiv2 } from "./goals-view-goals-view-div2";
import { GoalsViewSection1 } from "./goals-view-goals-view-section1";

import {
AllocationDialog,
ArchiveDialog,
ContributionDialog,
GoalFormDialog,
RecentAllocationsCard
} from "@/components/finance/goals/components";
import type {
GoalsDashboard
} from "@/components/finance/goals/goals-types";
import { InlineWarning } from "@/components/finance/inline-warning";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

export function GoalsView({ dashboard }: { dashboard: GoalsDashboard }) {
  const { isMutating, openCreateGoal, openAllocationDialog, openContributionDialog, openEditGoal, setArchiveGoal, canCreateContribution, goalDialog, goalForm, setGoalForm, setGoalDialog, startTransition, submitGoal, allocationDialog, allocationForm, setAllocationForm, setAllocationDialog, submitAllocation, contributionDialog, contributionForm, setContributionForm, setContributionDialog, submitContribution, archiveGoal, submitArchiveGoal } = useGoalsView({ dashboard });

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Metas"
          title="Metas e planos futuros"
          description="Planeje objetivos futuros, prazos e aportes. A classificação do patrimônio que já existe fica na Carteira atual."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild type="button" variant="outline">
                <Link href="/investments/portfolio">
                  Carteira atual
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button type="button" disabled={isMutating} onClick={openCreateGoal}>
                <Plus className="size-4" />
                Nova meta
              </Button>
            </div>
          }
        />

        {!dashboard.investmentProjection ? (
          <InlineWarning message="Cadastre a carteira de investimentos antes de alocar saldo para metas. Sem carteira, a reserva livre é considerada R$ 0,00." />
        ) : dashboard.summary.freeReserveCents < 0 ? (
          <InlineWarning message="As metas estão alocando mais do que o saldo investido consolidado. Libere saldo ou atualize a carteira para reequilibrar a reserva livre." />
        ) : null}

        <GoalsViewSection1 dashboard={dashboard} />

        <GoalsViewDiv2 dashboard={dashboard} openAllocationDialog={openAllocationDialog} openContributionDialog={openContributionDialog} openEditGoal={openEditGoal} setArchiveGoal={setArchiveGoal} canCreateContribution={canCreateContribution} isMutating={isMutating} openCreateGoal={openCreateGoal} />

        <RecentAllocationsCard dashboard={dashboard} />

        <GoalFormDialog
          open={Boolean(goalDialog)}
          mode={goalDialog?.mode ?? "create"}
          form={goalForm}
          setForm={setGoalForm}
          categories={dashboard.options.goalCategories}
          statuses={dashboard.options.goalStatuses}
          isPending={isMutating}
          onOpenChange={(open) => {
            if (!open) {
              setGoalDialog(null);
            }
          }}
          onSubmit={() => startTransition(() => void submitGoal())}
        />

        <AllocationDialog
          state={allocationDialog}
          form={allocationForm}
          setForm={setAllocationForm}
          freeReserveCents={dashboard.summary.freeReserveCents}
          isPending={isMutating}
          onOpenChange={(open) => {
            if (!open) {
              setAllocationDialog(null);
            }
          }}
          onSubmit={() => startTransition(() => void submitAllocation())}
        />

        <ContributionDialog
          state={contributionDialog}
          form={contributionForm}
          setForm={setContributionForm}
          sourceAccounts={dashboard.options.sourceAccounts}
          investmentCategories={dashboard.options.investmentCategories}
          isPending={isMutating}
          onOpenChange={(open) => {
            if (!open) {
              setContributionDialog(null);
            }
          }}
          onSubmit={() => startTransition(() => void submitContribution())}
        />

        <ArchiveDialog
          goal={archiveGoal}
          isPending={isMutating}
          onOpenChange={(open) => {
            if (!open) {
              setArchiveGoal(null);
            }
          }}
          onSubmit={() => startTransition(() => void submitArchiveGoal())}
        />
      </div>
    </TooltipProvider>
  );
}
