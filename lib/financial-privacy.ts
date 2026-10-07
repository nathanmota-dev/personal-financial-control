export const HIDDEN_FINANCIAL_VALUE = "Valor oculto";

export function financialPrivacyKey(demoMode: boolean) {
  return `personal-financial-control:privacy:${demoMode ? "demo" : "personal"}`;
}

// Only the presentation preference is stored. Financial data never enters this store.
export function createFinancialPrivacyStore(demoMode: boolean) {
  const key = financialPrivacyKey(demoMode);
  let hidden: boolean | undefined;
  const listeners = new Set<() => void>();

  function read() {
    try {
      return window.localStorage.getItem(key) === "hidden";
    } catch {
      return hidden ?? true;
    }
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== key && event.key !== null) return;
    hidden = read();
    notify();
  }

  return {
    getSnapshot: () => (hidden ??= read()),
    // The server and first hydration render always conceal values.
    getServerSnapshot: () => true,
    subscribe(listener: () => void) {
      listeners.add(listener);
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    setHidden(next: boolean) {
      hidden = next;
      try {
        window.localStorage.setItem(key, next ? "hidden" : "visible");
      } catch {
        // An in-memory preference keeps navigation and editing usable.
      }
      notify();
    },
  };
}
