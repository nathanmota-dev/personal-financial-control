import { useSyncExternalStore } from "react";

const query = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const list = window.matchMedia(query);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

/** True from the `lg` breakpoint up, where the chat docks beside the page instead of covering it. */
export function useDesktopLayout() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
}
