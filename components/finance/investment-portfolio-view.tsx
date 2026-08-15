"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  archiveInvestmentHoldingAction,
  archiveInvestmentPurposeAction,
  createInvestmentHoldingAction,
  createInvestmentPurposeAction,
  deleteInvestmentPurposeAllocationAction,
  updateInvestmentHoldingAction,
  updateInvestmentPurposeAction,
  upsertInvestmentPurposeAllocationAction,
} from "@/app/actions/finance";
import { AllocationDialog } from "@/components/finance/investment-portfolio/allocation-dialog";
import { DistributionChart } from "@/components/finance/investment-portfolio/distribution-chart";
import { HoldingDialog } from "@/components/finance/investment-portfolio/holding-dialog";
import { HoldingsTable } from "@/components/finance/investment-portfolio/holdings-table";
import { PortfolioSummary } from "@/components/finance/investment-portfolio/portfolio-summary";
import { PurposeCards } from "@/components/finance/investment-portfolio/purpose-cards";
import { PurposeDialog } from "@/components/finance/investment-portfolio/purpose-dialog";
import { ReconciliationAlert } from "@/components/finance/investment-portfolio/reconciliation-alert";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import type {
  AllocationDialogState,
  AllocationFormState,
  HoldingDialogState,
  HoldingFormState,
  InvestmentHoldingAllocation,
  InvestmentHoldingCard,
  InvestmentPortfolioViewProps,
  InvestmentPurposeCard,
  PortfolioMutationAction,
  PurposeDialogState,
  PurposeFormState,
} from "@/lib/interfaces/investment-portfolio";
import {
  centsToMoneyInput,
  defaultInvestmentPurposeColor,
  extractErrorMessage,
  moneyInputToCents,
} from "@/lib/finance-ui";

export function InvestmentPortfolioView({ dashboard }: InvestmentPortfolioViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const mutationInFlightRef = useRef(false);
  const [submittingAction, setSubmittingAction] =
    useState<PortfolioMutationAction | null>(null);
  const [holdingDialog, setHoldingDialog] = useState<HoldingDialogState>(null);
  const [holdingForm, setHoldingForm] = useState<HoldingFormState>(() =>
    emptyHoldingForm(dashboard)
  );
  const [purposeDialog, setPurposeDialog] = useState<PurposeDialogState>(null);
  const [purposeForm, setPurposeForm] = useState<PurposeFormState>(() =>
    emptyPurposeForm()
  );
  const [allocationDialog, setAllocationDialog] =
    useState<AllocationDialogState>(null);
  const [allocationForm, setAllocationForm] = useState<AllocationFormState>(() =>
    emptyAllocationForm(dashboard)
  );

  const mutationPending = isPending || submittingAction !== null;

  function beginMutation(action: PortfolioMutationAction) {
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

  function openCreateHolding() {
    setHoldingForm(emptyHoldingForm(dashboard));
    setHoldingDialog({ mode: "create" });
  }

  function openEditHolding(holding: InvestmentHoldingCard) {
    setHoldingForm({
      name: holding.name,
      ticker: holding.ticker ?? "",
      institutionName: holding.institutionName ?? "",
      assetClass: holding.assetClass,
      instrumentType: holding.instrumentType,
      currentValue: centsToMoneyInput(holding.currentValueCents),
      valueAsOf: holding.valueAsOf,
      notes: holding.notes ?? "",
    });
    setHoldingDialog({ mode: "edit", holding });
  }

  function openCreatePurpose() {
    setPurposeForm(emptyPurposeForm());
    setPurposeDialog({ mode: "create" });
  }

  function openEditPurpose(purpose: InvestmentPurposeCard) {
    setPurposeForm({
      name: purpose.name,
      targetAmount: purpose.targetAmountCents
        ? centsToMoneyInput(purpose.targetAmountCents)
        : "",
      color: purpose.color,
      notes: purpose.notes ?? "",
    });
    setPurposeDialog({ mode: "edit", purpose });
  }

  function openAllocationDialog(
    holding?: InvestmentHoldingCard,
    purpose?: InvestmentPurposeCard
  ) {
    const firstHolding =
      holding ??
      (purpose
        ? dashboard.holdings.find(
            (item) => !item.allocations.some((allocation) => allocation.purposeId === purpose.id)
          )
        : undefined) ??
      dashboard.holdings[0];
    const firstPurpose =
      purpose ??
      (holding
        ? dashboard.purposes.find(
            (item) => !holding.allocations.some((allocation) => allocation.purposeId === item.id)
          )
        : undefined) ??
      dashboard.purposes[0];

    if (!firstHolding || !firstPurpose) {
      toast.error("Cadastre pelo menos um ativo e uma caixinha antes de alocar.");
      return;
    }

    const existingAllocation = dashboard.allocations.find(
      (allocation) =>
        allocation.holdingId === firstHolding.id && allocation.purposeId === firstPurpose.id
    );
    const selectedHolding = dashboard.holdings.find(
      (item) => item.id === (existingAllocation?.holdingId ?? firstHolding.id)
    );
    const selectedHoldingAllocations = selectedHolding?.allocations ?? [];
    const allocatedElsewhereCents = selectedHoldingAllocations
      .filter((allocation) => allocation.id !== existingAllocation?.id)
      .reduce((total, allocation) => total + allocation.amountCents, 0);
    const availableCents = Math.max(
      (selectedHolding?.currentValueCents ?? firstHolding.currentValueCents) -
        allocatedElsewhereCents,
      0
    );
    const allocationAmountCents =
      existingAllocation && existingAllocation.amountCents > 0
        ? existingAllocation.amountCents
        : availableCents;

    setAllocationForm({
      holdingId: existingAllocation?.holdingId ?? firstHolding.id,
      purposeId: existingAllocation?.purposeId ?? firstPurpose.id,
      amount: allocationAmountCents > 0 ? centsToMoneyInput(allocationAmountCents) : "",
      allocatedOn: existingAllocation?.allocatedOn ?? todayDate(),
      notes: existingAllocation?.notes ?? "",
    });
    setAllocationDialog(existingAllocation ? { existingAllocation } : {});
    setAllocationAvailableCents(availableCents);
  }

  function openExistingAllocation(
    allocation: InvestmentHoldingAllocation
  ) {
    const holding = dashboard.holdings.find((item) => item.id === allocation.holdingId);
    const purpose = dashboard.purposes.find((item) => item.id === allocation.purposeId);

    if (holding && purpose) {
      openAllocationDialog(holding, purpose);
    }
  }

  const [allocationAvailableCents, setAllocationAvailableCents] = useState(0);

  function updateAllocationSelection(value: string) {
    const holding = dashboard.holdings.find((item) => item.id === value);
    if (!holding) {
      setAllocationForm((current) => ({ ...current, holdingId: value, amount: "" }));
      setAllocationAvailableCents(0);
      return;
    }

    const allocatedCents = holding.allocations.reduce(
      (total, allocation) => total + allocation.amountCents,
      0
    );
    const availableCents = Math.max(holding.currentValueCents - allocatedCents, 0);
    setAllocationForm((current) => ({
      ...current,
      holdingId: value,
      amount: availableCents > 0 ? centsToMoneyInput(availableCents) : "",
    }));
    setAllocationAvailableCents(availableCents);
  }

  async function submitHolding() {
    if (!beginMutation("holding")) {
      return;
    }

    try {
      const payload = {
        name: holdingForm.name,
        ticker: holdingForm.ticker || null,
        institutionName: holdingForm.institutionName || null,
        assetClass: holdingForm.assetClass,
        instrumentType: holdingForm.instrumentType,
        currentValueCents: moneyInputToCents(holdingForm.currentValue),
        valueAsOf: holdingForm.valueAsOf,
        notes: holdingForm.notes || null,
      };

      if (holdingDialog?.mode === "edit" && holdingDialog.holding) {
        await updateInvestmentHoldingAction({
          id: holdingDialog.holding.id,
          ...payload,
        });
        toast.success("Ativo atualizado.");
      } else {
        await createInvestmentHoldingAction(payload);
        toast.success("Ativo cadastrado.");
      }

      setHoldingDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      endMutation();
    }
  }

  async function submitPurpose() {
    if (!beginMutation("purpose")) {
      return;
    }

    try {
      const payload = {
        name: purposeForm.name,
        targetAmountCents: purposeForm.targetAmount.trim()
          ? moneyInputToCents(purposeForm.targetAmount)
          : null,
        color: purposeForm.color,
        notes: purposeForm.notes || null,
      };

      if (purposeDialog?.mode === "edit" && purposeDialog.purpose) {
        await updateInvestmentPurposeAction({
          id: purposeDialog.purpose.id,
          ...payload,
        });
        toast.success("Caixinha atualizada.");
      } else {
        await createInvestmentPurposeAction(payload);
        toast.success("Caixinha criada.");
      }

      setPurposeDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      endMutation();
    }
  }

  async function submitAllocation() {
    if (!beginMutation("allocation")) {
      return;
    }

    try {
      const amountCents = moneyInputToCents(allocationForm.amount);

      if (amountCents <= 0) {
        toast.error("Informe um valor alocado maior que zero.");
        return;
      }

      await upsertInvestmentPurposeAllocationAction({
        holdingId: allocationForm.holdingId,
        purposeId: allocationForm.purposeId,
        amountCents,
        allocatedOn: allocationForm.allocatedOn,
        notes: allocationForm.notes || null,
      });
      toast.success("Alocação salva.");
      setAllocationDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      endMutation();
    }
  }

  async function deleteAllocation() {
    if (!allocationDialog?.existingAllocation || !beginMutation("delete-allocation")) {
      return;
    }

    try {
      await deleteInvestmentPurposeAllocationAction(
        allocationDialog.existingAllocation.id
      );
      toast.success("Alocação removida.");
      setAllocationDialog(null);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      endMutation();
    }
  }

  async function archiveHolding(holding: InvestmentHoldingCard) {
    if (!window.confirm("Arquivar o ativo " + holding.name + "?")) {
      return;
    }
    if (!beginMutation("archive-holding")) {
      return;
    }

    try {
      await archiveInvestmentHoldingAction(holding.id);
      toast.success("Ativo arquivado.");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      endMutation();
    }
  }

  async function archivePurpose(purpose: InvestmentPurposeCard) {
    if (!window.confirm("Arquivar a caixinha " + purpose.name + "?")) {
      return;
    }
    if (!beginMutation("archive-purpose")) {
      return;
    }

    try {
      await archiveInvestmentPurposeAction(purpose.id);
      toast.success("Caixinha arquivada.");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      endMutation();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Investimentos / Carteira atual"
        title="Seu patrimônio, em perspectiva"
        description="Classifique os ativos que já existem na carteira por finalidade, acompanhe o que ainda está livre e reconcilie tudo com o saldo global."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/investments">
                <ArrowLeft className="size-4" />
                Visão geral
              </Link>
            </Button>
            <Button type="button" onClick={openCreateHolding}>
              <Plus className="size-4" />
              Novo ativo
            </Button>
          </div>
        }
      />

      <ReconciliationAlert dashboard={dashboard} />
      <PortfolioSummary dashboard={dashboard} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <PurposeCards
          dashboard={dashboard}
          onCreate={openCreatePurpose}
          onEdit={openEditPurpose}
          onAllocate={(purpose) => openAllocationDialog(undefined, purpose)}
          onArchive={archivePurpose}
        />
        <DistributionChart dashboard={dashboard} />
      </div>

      <HoldingsTable
        dashboard={dashboard}
        onCreate={openCreateHolding}
        onEdit={openEditHolding}
        onAllocate={(holding) => openAllocationDialog(holding)}
        onEditAllocation={openExistingAllocation}
        onArchive={archiveHolding}
      />

      <HoldingDialog
        state={holdingDialog}
        form={holdingForm}
        setForm={setHoldingForm}
        assetClasses={dashboard.options.assetClasses}
        instrumentTypes={dashboard.options.instrumentTypes}
        isPending={mutationPending && submittingAction === "holding"}
        onOpenChange={(open) => {
          if (!open) {
            setHoldingDialog(null);
          }
        }}
        onSubmit={() => startTransition(() => void submitHolding())}
      />
      <PurposeDialog
        state={purposeDialog}
        form={purposeForm}
        setForm={setPurposeForm}
        isPending={mutationPending && submittingAction === "purpose"}
        onOpenChange={(open) => {
          if (!open) {
            setPurposeDialog(null);
          }
        }}
        onSubmit={() => startTransition(() => void submitPurpose())}
      />
      <AllocationDialog
        state={allocationDialog}
        form={allocationForm}
        setForm={setAllocationForm}
        holdings={dashboard.holdings}
        purposes={dashboard.purposes}
        availableCents={allocationAvailableCents}
        isExisting={Boolean(allocationDialog?.existingAllocation)}
        isPending={mutationPending && (submittingAction === "allocation" || submittingAction === "delete-allocation")}
        onHoldingChange={updateAllocationSelection}
        onOpenChange={(open) => {
          if (!open) {
            setAllocationDialog(null);
          }
        }}
        onSubmit={() => startTransition(() => void submitAllocation())}
        onDelete={() => startTransition(() => void deleteAllocation())}
      />
    </div>
  );
}

function emptyHoldingForm(
  dashboard: InvestmentPortfolioViewProps["dashboard"]
): HoldingFormState {
  return {
    name: "",
    ticker: "",
    institutionName: "",
    assetClass: dashboard.options.assetClasses[0]?.value ?? "other",
    instrumentType: dashboard.options.instrumentTypes[0]?.value ?? "other",
    currentValue: "",
    valueAsOf: todayDate(),
    notes: "",
  };
}

function emptyPurposeForm(): PurposeFormState {
  return {
    name: "",
    targetAmount: "",
    color: defaultInvestmentPurposeColor,
    notes: "",
  };
}

function emptyAllocationForm(
  dashboard: InvestmentPortfolioViewProps["dashboard"]
): AllocationFormState {
  return {
    holdingId: dashboard.holdings[0]?.id ?? "",
    purposeId: dashboard.purposes[0]?.id ?? "",
    amount: "",
    allocatedOn: todayDate(),
    notes: "",
  };
}

function todayDate() {
  const date = new Date();

  return (
    String(date.getFullYear()) +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}
