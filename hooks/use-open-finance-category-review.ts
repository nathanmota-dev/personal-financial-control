import { useCallback, useEffect, useState } from "react";

import type { PluggyPendingCategoriesResponse, PluggyPendingCategoryGroup } from "@/lib/interfaces/pluggy-category-rules";
import { pluggyCategoryGroupKey, pluggyRequest } from "@/lib/pluggy-ui";

const PATH = "/api/pluggy/category-rules";
const failureMessage = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";

/** `refreshKey` changes when a sync finishes, because that is what brings new pending descriptions. */
export function useOpenFinanceCategoryReview(refreshKey: string | null) {
  const [groups, setGroups] = useState<PluggyPendingCategoryGroup[] | null>(null);
  const [applyingKey, setApplyingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    pluggyRequest<PluggyPendingCategoriesResponse>(PATH)
      .then((result) => { if (active) { setGroups(result.pending); setError(null); } })
      .catch((failure: unknown) => { if (active) setError(failureMessage(failure)); });
    return () => { active = false; };
  }, [refreshKey]);

  const apply = useCallback(async (group: PluggyPendingCategoryGroup, categoryId: string) => {
    setApplyingKey(pluggyCategoryGroupKey(group));
    setError(null);
    try {
      const { normalizedDescription, direction } = group;
      setGroups((await pluggyRequest<PluggyPendingCategoriesResponse>(PATH, "POST", { normalizedDescription, direction, categoryId })).pending);
    } catch (failure) {
      setError(failureMessage(failure));
    } finally {
      setApplyingKey(null);
    }
  }, []);

  return { groups, applyingKey, error, apply };
}
