import { useCallback, useEffect, useRef, useState } from "react";

import type { AiModelsDraft, AiModelOption } from "@/lib/interfaces/ai-settings";
import { pluggyRequest } from "@/lib/pluggy-ui";

type ModelsResponse = { models: AiModelOption[] };
type ModelsState = { models: AiModelOption[]; loading: boolean; error: string | null };

const endpoint = "/api/ai/settings/models";
const idle: ModelsState = { models: [], loading: false, error: null };

const failureMessage = (error: unknown) => error instanceof Error ? error.message : "Não foi possível listar os modelos.";

/**
 * The models a local provider has installed, asked from its server. Only the latest request may update the list,
 * so an answer for an address the user already changed is dropped. `initial` loads once, on mount.
 */
export function useAiModels(initial: AiModelsDraft | null) {
  const [first] = useState(initial);
  const [state, setState] = useState<ModelsState>(first ? { ...idle, loading: true } : idle);
  const latest = useRef(0);

  const settle = useCallback((id: number, draft: AiModelsDraft) => pluggyRequest<ModelsResponse>(endpoint, "POST", draft).then(
    (result) => { if (latest.current === id) setState({ models: result.models, loading: false, error: null }); },
    (failure: unknown) => { if (latest.current === id) setState({ models: [], loading: false, error: failureMessage(failure) }); },
  ), []);

  useEffect(() => {
    if (first) void settle(++latest.current, first);
  }, [first, settle]);

  const load = useCallback(async (draft: AiModelsDraft) => {
    const id = ++latest.current;
    setState((current) => ({ ...current, loading: true, error: null }));
    await settle(id, draft);
  }, [settle]);

  const clear = useCallback(() => {
    latest.current += 1;
    setState(idle);
  }, []);

  return { ...state, load, clear };
}
