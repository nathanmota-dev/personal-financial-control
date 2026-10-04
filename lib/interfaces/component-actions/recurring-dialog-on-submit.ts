import type {
RecurringTemplateRow
} from "@/lib/interfaces/recurring";

export interface RecurringDialogOnSubmitContext {
  setFormError: import("react").Dispatch<import("react").SetStateAction<string | null>>;
  template: RecurringTemplateRow | undefined;
  setOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
}
