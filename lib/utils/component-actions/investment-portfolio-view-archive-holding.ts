import {
archiveInvestmentHoldingAction
} from "@/app/actions/finance";
import {
extractErrorMessage
} from "@/lib/finance-ui";
import type { InvestmentPortfolioViewArchiveHoldingContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-archive-holding";
import type {
InvestmentHoldingCard
} from "@/lib/interfaces/investment-portfolio";
import { toast } from "sonner";

export async function InvestmentPortfolioViewArchiveHolding({ beginMutation, router, endMutation }: InvestmentPortfolioViewArchiveHoldingContext, holding: InvestmentHoldingCard) {
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
