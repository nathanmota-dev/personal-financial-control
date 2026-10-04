import {
createRecurringTemplateAction,
updateRecurringTemplateAction,
} from "@/app/actions/finance";
import {
moneyInputToCents
} from "@/lib/finance-ui";
import type { RecurringDialogOnSubmitContext } from "@/lib/interfaces/component-actions/recurring-dialog-on-submit";
import type {
RecurringTemplateRow
} from "@/lib/interfaces/recurring";
import { toast } from "sonner";

export async function RecurringDialogOnSubmit({ setFormError, template, setOpen, router }: RecurringDialogOnSubmitContext, formData: FormData) {
    setFormError(null);
    const name = String(formData.get("name") ?? "").trim();
    const rawAmount = String(formData.get("amount") ?? "").trim();
    const accountId = String(formData.get("accountId") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "").trim();

    if (!name) {
      setFormError("Informe um nome para a recorrência.");
      toast.error("Informe um nome para a recorrência.");
      return;
    }

    let amountCents: number;
    try {
      amountCents = moneyInputToCents(rawAmount);
    } catch {
      setFormError("Informe um valor monetário válido.");
      toast.error("Informe um valor monetário válido.");
      return;
    }

    if (amountCents <= 0) {
      setFormError("Informe um valor maior que zero.");
      toast.error("Informe um valor maior que zero.");
      return;
    }

    if (!accountId) {
      setFormError("Selecione uma conta para a recorrência.");
      toast.error("Selecione uma conta para a recorrência.");
      return;
    }

    if (!categoryId) {
      setFormError("Selecione uma categoria para a recorrência.");
      toast.error("Selecione uma categoria para a recorrência.");
      return;
    }

    const payload = {
      accountId,
      categoryId,
      type: String(formData.get("type")) as RecurringTemplateRow["type"],
      status: String(formData.get("status")) as RecurringTemplateRow["status"],
      amountCents,
      dayOfMonth: Number(formData.get("dayOfMonth")),
      startMonth: String(formData.get("startMonth") ?? ""),
      endMonth: String(formData.get("endMonth") ?? "") || undefined,
      name,
    };

    const result = template
      ? await updateRecurringTemplateAction({ id: template.id, ...payload })
      : await createRecurringTemplateAction(payload);

    if (!result.ok) {
      setFormError(result.error.message);
      toast.error(result.error.message);
      return;
    }

    toast.success(template ? "Recorrência atualizada." : "Recorrência criada.");
    setOpen(false);
    router.refresh();
  }
