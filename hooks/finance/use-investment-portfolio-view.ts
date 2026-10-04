"use client";
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
import { InvestmentPortfolioViewArchiveHolding } from "@/lib/utils/component-actions/investment-portfolio-view-archive-holding";
import { InvestmentPortfolioViewArchivePurpose } from "@/lib/utils/component-actions/investment-portfolio-view-archive-purpose";
import { InvestmentPortfolioViewBeginMutation } from "@/lib/utils/component-actions/investment-portfolio-view-begin-mutation";
import { InvestmentPortfolioViewDeleteAllocation } from "@/lib/utils/component-actions/investment-portfolio-view-delete-allocation";
import { InvestmentPortfolioViewEndMutation } from "@/lib/utils/component-actions/investment-portfolio-view-end-mutation";
import { InvestmentPortfolioViewOpenAllocationDialog } from "@/lib/utils/component-actions/investment-portfolio-view-open-allocation-dialog";
import { InvestmentPortfolioViewOpenCreateHolding } from "@/lib/utils/component-actions/investment-portfolio-view-open-create-holding";
import { InvestmentPortfolioViewOpenCreatePurpose } from "@/lib/utils/component-actions/investment-portfolio-view-open-create-purpose";
import { InvestmentPortfolioViewOpenEditHolding } from "@/lib/utils/component-actions/investment-portfolio-view-open-edit-holding";
import { InvestmentPortfolioViewOpenEditPurpose } from "@/lib/utils/component-actions/investment-portfolio-view-open-edit-purpose";
import { InvestmentPortfolioViewOpenExistingAllocation } from "@/lib/utils/component-actions/investment-portfolio-view-open-existing-allocation";
import { InvestmentPortfolioViewSubmitAllocation } from "@/lib/utils/component-actions/investment-portfolio-view-submit-allocation";
import { InvestmentPortfolioViewSubmitHolding } from "@/lib/utils/component-actions/investment-portfolio-view-submit-holding";
import { InvestmentPortfolioViewSubmitPurpose } from "@/lib/utils/component-actions/investment-portfolio-view-submit-purpose";
import { InvestmentPortfolioViewUpdateAllocationSelection } from "@/lib/utils/component-actions/investment-portfolio-view-update-allocation-selection";
import { emptyAllocationForm,emptyHoldingForm,emptyPurposeForm } from "@/lib/utils/components/investment-portfolio-view";
import { useRouter } from "next/navigation";
import { useRef,useState,useTransition } from "react";

export function useInvestmentPortfolioView({ dashboard }: InvestmentPortfolioViewProps) {
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
    return InvestmentPortfolioViewBeginMutation({ mutationInFlightRef, setSubmittingAction }, action);
  }

function endMutation() {
    return InvestmentPortfolioViewEndMutation({ mutationInFlightRef, setSubmittingAction });
  }

function openCreateHolding() {
    return InvestmentPortfolioViewOpenCreateHolding({ setHoldingForm, dashboard, setHoldingDialog });
  }

function openEditHolding(holding: InvestmentHoldingCard) {
    return InvestmentPortfolioViewOpenEditHolding({ setHoldingForm, setHoldingDialog }, holding);
  }

function openCreatePurpose() {
    return InvestmentPortfolioViewOpenCreatePurpose({ setPurposeForm, setPurposeDialog });
  }

function openEditPurpose(purpose: InvestmentPurposeCard) {
    return InvestmentPortfolioViewOpenEditPurpose({ setPurposeForm, setPurposeDialog }, purpose);
  }

function openAllocationDialog(
    holding?: InvestmentHoldingCard,
    purpose?: InvestmentPurposeCard
  ) {
    return InvestmentPortfolioViewOpenAllocationDialog({ dashboard, setAllocationForm, setAllocationDialog, setAllocationAvailableCents }, holding, purpose);
  }

function openExistingAllocation(
    allocation: InvestmentHoldingAllocation
  ) {
    return InvestmentPortfolioViewOpenExistingAllocation({ dashboard, openAllocationDialog }, allocation);
  }

const [allocationAvailableCents, setAllocationAvailableCents] = useState(0);

function updateAllocationSelection(value: string) {
    return InvestmentPortfolioViewUpdateAllocationSelection({ dashboard, setAllocationForm, setAllocationAvailableCents }, value);
  }

async function submitHolding() {
    return InvestmentPortfolioViewSubmitHolding({ beginMutation, holdingForm, holdingDialog, setHoldingDialog, router, endMutation });
  }

async function submitPurpose() {
    return InvestmentPortfolioViewSubmitPurpose({ beginMutation, purposeForm, purposeDialog, setPurposeDialog, router, endMutation });
  }

async function submitAllocation() {
    return InvestmentPortfolioViewSubmitAllocation({ beginMutation, allocationForm, setAllocationDialog, router, endMutation });
  }

async function deleteAllocation() {
    return InvestmentPortfolioViewDeleteAllocation({ allocationDialog, beginMutation, setAllocationDialog, router, endMutation });
  }

async function archiveHolding(holding: InvestmentHoldingCard) {
    return InvestmentPortfolioViewArchiveHolding({ beginMutation, router, endMutation }, holding);
  }

async function archivePurpose(purpose: InvestmentPurposeCard) {
    return InvestmentPortfolioViewArchivePurpose({ beginMutation, router, endMutation }, purpose);
  }
return { openCreateHolding, openCreatePurpose, openEditPurpose, openAllocationDialog, archivePurpose, openEditHolding, openExistingAllocation, archiveHolding, holdingDialog, holdingForm, setHoldingForm, mutationPending, submittingAction, setHoldingDialog, startTransition, submitHolding, purposeDialog, purposeForm, setPurposeForm, setPurposeDialog, submitPurpose, allocationDialog, allocationForm, setAllocationForm, allocationAvailableCents, updateAllocationSelection, setAllocationDialog, submitAllocation, deleteAllocation };
}
