"use client";

import { useEffect, useState } from "react";
import type { ReportDeferredState, ReportPeriod } from "@/lib/interfaces/reports";

export function useReportViews({ mode, period }: ReportPeriod) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ReportDeferredState>({ categories: null, entries: null, categoryError: false, entriesError: false });
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      // The initial months response is already rendered before these requests start.
      await Promise.allSettled((["categories", "sources"] as const).map(async (view) => {
        const params = new URLSearchParams({ mode, period, view });
        try {
          const response = await fetch(`/api/reports?${params}`, { signal: controller.signal, cache: "no-store" });
          if (!response.ok) throw new Error("Report request failed");
          const data = await response.json();
          if (controller.signal.aborted) return;
          setState((previous) => view === "categories"
            ? { ...previous, categories: data.categories, categoryError: false }
            : { ...previous, entries: data.entries, entriesError: false });
        } catch {
          if (controller.signal.aborted) return;
          setState((previous) => view === "categories"
            ? { ...previous, categoryError: true }
            : { ...previous, entriesError: true });
        }
      }));
    }
    void load();
    return () => controller.abort();
  }, [mode, period, attempt]);
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
