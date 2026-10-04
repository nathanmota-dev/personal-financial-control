
export interface ProjectionFiltersUpdateFiltersContext {
  filters: import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState;
  startTransition: import("react").TransitionStartFunction;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
  pathname: string;
}
