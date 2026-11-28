"use client";

import { useEffect, useState } from "react";

import { listRecurringLinkCandidatesAction } from "@/app/actions/finance";
import type { RecurringLinkCandidatesResult } from "@/lib/interfaces/recurring-occurrences";

type CandidatesState = { result: RecurringLinkCandidatesResult | null; error: string | null };

/** Loads the entries that may pay the rule in `month` once, when the dialog mounts. */
export function useRecurringLinkCandidates(templateId: string, month: string) {
  const [state, setState] = useState<CandidatesState>({ result: null, error: null });

  useEffect(() => {
    let active = true;
    listRecurringLinkCandidatesAction(templateId, month)
      .then((response) => {
        if (!active) return;
        setState(response.ok ? { result: response.data, error: null } : { result: null, error: response.error.message });
      })
      .catch(() => active && setState({ result: null, error: "Não foi possível carregar os lançamentos." }));
    return () => {
      active = false;
    };
  }, [templateId, month]);

  return state;
}
