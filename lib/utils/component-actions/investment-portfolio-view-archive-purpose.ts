import {
archiveInvestmentPurposeAction
} from "@/app/actions/finance";
import {
extractErrorMessage
} from "@/lib/finance-ui";
import type { InvestmentPortfolioViewArchivePurposeContext } from "@/lib/interfaces/component-actions/investment-portfolio-view-archive-purpose";
import type {
InvestmentPurposeCard
} from "@/lib/interfaces/investment-portfolio";
import { toast } from "sonner";

export async function InvestmentPortfolioViewArchivePurpose({ beginMutation, router, endMutation }: InvestmentPortfolioViewArchivePurposeContext, purpose: InvestmentPurposeCard) {
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
