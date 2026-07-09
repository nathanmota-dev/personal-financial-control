"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Flag,
  PiggyBank,
  Plus,
  ShieldCheck,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import {
  AllocationBreakdownCard,
  AllocationDialog,
  ArchiveDialog,
  ContributionDialog,
  GoalArchiveCard,
  GoalCardItem,
  GoalFormDialog,
  MonthlyEvolutionCard,
  RecentAllocationsCard,
  SummaryCard,
} from "@/components/finance/goals/components";
import type {
  AllocationDialogState,
  AllocationFormState,
  ContributionDialogState,
  ContributionFormState,
  GoalCard,
  GoalDialogState,
  GoalFormState,
  GoalsDashboard,
  MutationAction,
} from "@/components/finance/goals/goals-types";
import {
  apiRequest,
  buildIsoDate,
  emptyGoalForm,
  goalToForm,
} from "@/components/finance/goals/goals-utils";
import { InlineWarning } from "@/components/finance/inline-warning";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatCurrency, moneyInputToCents } from "@/lib/finance-ui";

export function GoalsView({ dashboard }: { dashboard: GoalsDashboard }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const mutationInFlightRef = useRef(false);
  const [submittingAction, setSubmittingAction] = useState<MutationAction | null>(
    null
  );
  const [goalDialog, setGoalDialog] = useState<GoalDialogState>(null);
  const [goalForm, setGoalForm] = useState<GoalFormState>(() => emptyGoalForm());
  const [allocationDialog, setAllocationDialog] =
    useState<AllocationDialogState>(null);
  const [allocationForm, setAllocationForm] = useState<AllocationFormState>({
    amount: "",
    occurredOn: buildIsoDate(),
    notes: "",
  });
  const [contributionDialog, setContributionDialog] =
    useState<ContributionDialogState>(null);
  const [contributionForm, setContributionForm] = useState<ContributionFormState>({
    amount: "",
    transactionDate: buildIsoDate(),
    accountId: dashboard.options.sourceAccounts[0]?.id ?? "",
    categoryId: dashboard.options.investmentCategories[0]?.id ?? "",
    notes: "",
  });
  const [archiveGoal, setArchiveGoal] = useState<GoalCard | null>(null);

  const canCreateContribution = Boolean(
    dashboard.options.sourceAccounts.length &&
      dashboard.options.investmentCategories.length
  );
  const isMutating = isPending || submittingAction !== null;

  function beginMutation(action: MutationAction) {
    if (mutationInFlightRef.current) {
      return false;
    }

    mutationInFlightRef.current = true;
    setSubmittingAction(action);
    return true;
  }

  function endMutation() {
    mutationInFlightRef.current = false;
    setSubmittingAction(null);
  }

  function openCreateGoal() {
    setGoalForm(emptyGoalForm());
    setGoalDialog({ mode: "create" });
  }

  function openEditGoal(goal: GoalCard) {
    setGoalForm(goalToForm(goal));
    setGoalDialog({ mode: "edit", goal });
  }

  function openAllocationDialog(
    goal: GoalCard,
    type: "manual_allocation" | "manual_release"
  ) {
    setAllocationForm({
      amount: "",
      occurredOn: buildIsoDate(),
      notes: "",
    });
    setAllocationDialog({ goal, type });
  }

  function openContributionDialog(goal: GoalCard) {
    setContributionForm((state) => ({
      ...state,
      amount: "",
      transactionDate: buildIsoDate(),
      notes: "",
      accountId: state.accountId || dashboard.options.sourceAccounts[0]?.id || "",
      categoryId:
        state.categoryId || dashboard.options.investmentCategories[0]?.id || "",
    }));
    setContributionDialog({ goal });
  }

  async function submitGoal() {
    if (!beginMutation("goal")) {
      return;
    }

    const payload = {
      name: goalForm.name,
      category: goalForm.category,
      targetAmountCents: moneyInputToCents(goalForm.targetAmount),
      targetDate: goalForm.targetDate || null,
      plannedMonthlyContributionCents: goalForm.plannedMonthlyContribution
        ? moneyInputToCents(goalForm.plannedMonthlyContribution)
        : 0,
      priority: Number(goalForm.priority || 0),
      status: goalForm.status,
      color: goalForm.color,
      notes: goalForm.notes || null,
      ...(goalDialog?.mode === "create"
        ? {
            initialAllocationCents: goalForm.initialAllocation
              ? moneyInputToCents(goalForm.initialAllocation)
              : 0,
            initialAllocationDate: buildIsoDate(),
          }
        : {}),
    };

    try {
      if (goalDialog?.mode === "edit" && goalDialog.goal) {
        await apiRequest(
          `/api/goals/${goalDialog.goal.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
          "Não foi possível atualizar a meta."
        );
        toast.success("Meta atualizada.");
      } else {
        await apiRequest(
          "/api/goals",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
          "Não foi possível criar a meta."
        );
        toast.success("Meta criada.");
      }

      setGoalDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar meta.");
    } finally {
      endMutation();
    }
  }

  async function submitAllocation() {
    if (!allocationDialog) {
      return;
    }

    if (!beginMutation("allocation")) {
      return;
    }

    try {
      await apiRequest(
        `/api/goals/${allocationDialog.goal.id}/allocations`,
        {
          method: "POST",
          body: JSON.stringify({
            type: allocationDialog.type,
            amountCents: moneyInputToCents(allocationForm.amount),
            occurredOn: allocationForm.occurredOn,
            notes: allocationForm.notes || null,
          }),
        },
        "Não foi possível atualizar a alocação."
      );
      toast.success(
        allocationDialog.type === "manual_release"
          ? "Saldo liberado."
          : "Saldo alocado."
      );
      setAllocationDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar alocação."
      );
    } finally {
      endMutation();
    }
  }

  async function submitContribution() {
    if (!contributionDialog) {
      return;
    }

    if (!beginMutation("contribution")) {
      return;
    }

    try {
      await apiRequest(
        `/api/goals/${contributionDialog.goal.id}/contributions`,
        {
          method: "POST",
          body: JSON.stringify({
            accountId: contributionForm.accountId,
            categoryId: contributionForm.categoryId,
            amountCents: moneyInputToCents(contributionForm.amount),
            transactionDate: contributionForm.transactionDate,
            notes: contributionForm.notes || null,
          }),
        },
        "Não foi possível registrar o aporte."
      );
      toast.success("Aporte registrado na meta.");
      setContributionDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao registrar aporte."
      );
    } finally {
      endMutation();
    }
  }

  async function submitArchiveGoal() {
    if (!archiveGoal) {
      return;
    }

    if (!beginMutation("archive")) {
      return;
    }

    try {
      await apiRequest(
        `/api/goals/${archiveGoal.id}`,
        {
          method: "DELETE",
        },
        "Não foi possível arquivar a meta."
      );
      toast.success("Meta arquivada.");
      setArchiveGoal(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao arquivar meta.");
    } finally {
      endMutation();
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Metas"
          title="Metas e planos futuros"
          description="Separe o que já está investido por finalidade e mantenha a reserva financeira livre visível antes de assumir novos compromissos."
          actions={
            <Button type="button" disabled={isMutating} onClick={openCreateGoal}>
              <Plus className="size-4" />
              Nova meta
            </Button>
          }
        />

        {!dashboard.investmentProjection ? (
          <InlineWarning message="Cadastre a carteira de investimentos antes de alocar saldo para metas. Sem carteira, a reserva livre é considerada R$ 0,00." />
        ) : dashboard.summary.freeReserveCents < 0 ? (
          <InlineWarning message="As metas estão alocando mais do que o saldo investido consolidado. Libere saldo ou atualize a carteira para reequilibrar a reserva livre." />
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Investido total"
            value={formatCurrency(dashboard.summary.investmentBalanceCents)}
            icon={<PiggyBank className="size-5" />}
            tone="cyan"
          />
          <SummaryCard
            label="Alocado em metas"
            value={formatCurrency(dashboard.summary.totalAllocatedCents)}
            icon={<Target className="size-5" />}
            tone="sky"
          />
          <SummaryCard
            label="Reserva livre"
            value={formatCurrency(dashboard.summary.freeReserveCents)}
            icon={<ShieldCheck className="size-5" />}
            tone={dashboard.summary.freeReserveCents >= 0 ? "teal" : "rose"}
          />
          <SummaryCard
            label="Falta para metas"
            value={formatCurrency(dashboard.summary.remainingToGoalsCents)}
            icon={<Flag className="size-5" />}
            tone="amber"
          />
          <SummaryCard
            label="Aporte mensal necessário"
            value={formatCurrency(dashboard.summary.monthlyRequiredCents)}
            icon={<CalendarClock className="size-5" />}
            tone="violet"
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(360px,0.84fr)]">
          <Tabs defaultValue="active" className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold text-slate-100">
                  Carteira por objetivo
                </h2>
                <p className="text-sm text-slate-400">
                  {dashboard.summary.goalCount} metas ativas ou pausadas
                </p>
              </div>
              <TabsList className="border border-slate-800 bg-slate-950/70 text-slate-300">
                <TabsTrigger value="active">Atuais</TabsTrigger>
                <TabsTrigger value="archived">
                  Arquivadas ({dashboard.summary.archivedGoalCount})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="active" className="mt-4">
              {dashboard.goals.length ? (
                <div className="grid gap-4 2xl:grid-cols-2">
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
                <div className="grid gap-4 2xl:grid-cols-2">
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

          <div className="grid gap-6">
            <AllocationBreakdownCard dashboard={dashboard} />
            <MonthlyEvolutionCard dashboard={dashboard} />
          </div>
        </div>

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
