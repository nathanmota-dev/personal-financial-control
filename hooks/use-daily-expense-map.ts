"use client";

import { useEffect, useRef, useState } from "react";
import type { DailyExpenseMapQuery, DailyExpenseMapState } from "@/lib/interfaces/daily-expenses";

export function useDailyExpenseMap({ period, enabled }: DailyExpenseMapQuery) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DailyExpenseMapState | null>(null);
  const completed = useRef<DailyExpenseMapState | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => {
    controller.current?.abort();
    controller.current = null;
  }, [period, attempt]);

  useEffect(() => {
    if (!enabled || controller.current || (completed.current?.period === period && completed.current.attempt === attempt)) return;
    const request = new AbortController();
    controller.current = request;
    function finish(map: DailyExpenseMapState["map"], error: boolean) {
      if (request.signal.aborted) return;
      controller.current = null;
      completed.current = { period, attempt, map, error };
      setState(completed.current);
    }
    async function load() {
      try {
        const params = new URLSearchParams({ mode: "monthly", period, view: "daily-expenses" });
        const response = await fetch(`/api/reports?${params}`, { signal: request.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Daily expense map request failed");
        const data = await response.json();
        if (!data.map || data.map.period !== period) throw new Error("Missing daily expense map");
        finish(data.map, false);
      } catch {
        finish(null, true);
      }
    }
    void load();
  }, [period, enabled, attempt]);

  const current = state?.period === period && state.attempt === attempt ? state : null;
  return { map: current?.map ?? null, error: current?.error ?? false, retry: () => setAttempt((value) => value + 1) };
}
