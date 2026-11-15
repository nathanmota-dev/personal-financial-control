/** 3D illustrations of the error and not-found screens. */
export const ROUTE_STATUS_ILLUSTRATIONS = {
  error: "/images/error-warning.webp",
  notFound: "/images/not-found-search.webp",
} as const;

export const ROUTE_STATUS_BUTTON_CLASS = "h-10 gap-[10px] rounded-[10px] text-[13px] font-medium";

/** Reads the message and digest of a value thrown inside an error boundary. */
export function describeRouteError(error: unknown) {
  const message = error instanceof Error && error.message ? error.message : "Erro inesperado ao montar a tela.";
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;
  return { message, digest };
}
