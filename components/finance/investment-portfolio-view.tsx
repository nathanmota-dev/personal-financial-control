"use client";

import { useInvestmentPortfolioView } from "@/hooks/finance/use-investment-portfolio-view";
import { ArrowLeft,Plus } from "lucide-react";
import Link from "next/link";

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
InvestmentPortfolioViewProps
} from "@/lib/interfaces/investment-portfolio";

export function InvestmentPortfolioView({ dashboard }: InvestmentPortfolioViewProps) {
  const { openCreateHolding, openCreatePurpose, openEditPurpose, openAllocationDialog, archivePurpose, openEditHolding, openExistingAllocation, archiveHolding, holdingDialog, holdingForm, setHoldingForm, mutationPending, submittingAction, setHoldingDialog, startTransition, submitHolding, purposeDialog, purposeForm, setPurposeForm, setPurposeDialog, submitPurpose, allocationDialog, allocationForm, setAllocationForm, allocationAvailableCents, updateAllocationSelection, setAllocationDialog, submitAllocation, deleteAllocation } = useInvestmentPortfolioView({ dashboard });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Investimentos / Carteira atual"
        title="Carteira atual"
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
