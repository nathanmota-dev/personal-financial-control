"use client";

import { useEffect, useRef, useState } from "react";
import type { MonthlySummaryQuery, MonthlySummaryState } from "@/lib/interfaces/monthly-retrospective";

export function useMonthlySummary({ period, enabled }: MonthlySummaryQuery) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<MonthlySummaryState | null>(null);
  // Owned by the report route, rather than the tab's mounted content. Keep the
  // completed response across view changes; a new route/period gets fresh data.
  const completed = useRef<MonthlySummaryState | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => {
    controller.current?.abort();
    controller.current = null;
  }, [period, attempt]);
  useEffect(() => {
    if (!enabled || controller.current || (completed.current?.period === period && completed.current.attempt === attempt)) return;
    const request = new AbortController();
    controller.current = request;
    function finish(summary: MonthlySummaryState["summary"], error: boolean) {
      if (request.signal.aborted) return;
      controller.current = null;
      completed.current = { period, attempt, summary, error };
      setState(completed.current);
    }
    async function load() {
      try {
        const params = new URLSearchParams({ mode: "monthly", period, view: "summary" });
        const response = await fetch(`/api/reports?${params}`, { signal: request.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Summary request failed");
        const data = await response.json();
        if (!data.summary || data.summary.period !== period) throw new Error("Missing monthly summary");
        finish(data.summary, false);
      } catch {
        finish(null, true);
      }
    }
    void load();
  }, [period, enabled, attempt]);
  const current = state?.period === period && state.attempt === attempt ? state : null;
  return { summary: current?.summary ?? null, error: current?.error ?? false, retry: () => setAttempt((value) => value + 1) };
}
