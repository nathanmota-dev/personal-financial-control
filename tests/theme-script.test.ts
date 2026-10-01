import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

import { themeInitializationScript } from "@/lib/theme-script";

function initializeTheme(savedTheme: string | null, prefersDark: boolean, storageBlocked = false) {
  const classes = new Set(["h-full", "notranslate", "dark"]);
  const root = {
    classList: {
      remove: (...values: string[]) => values.forEach((value) => classes.delete(value)),
      add: (value: string) => classes.add(value),
    },
    style: { colorScheme: "" },
  };
  runInNewContext(themeInitializationScript, {
    localStorage: {
      getItem: () => {
        if (storageBlocked) throw new Error("Storage blocked");
        return savedTheme;
      },
    },
    window: { matchMedia: () => ({ matches: prefersDark }) },
    document: { documentElement: root },
  });
  return { classes, colorScheme: root.style.colorScheme };
}

describe("theme initialization before hydration", () => {
  it.each([true, false])("uses the browser preference (%s) on the first visit", (dark) => {
    const result = initializeTheme(null, dark);
    expect(result.colorScheme).toBe(dark ? "dark" : "light");
    expect(result.classes).toEqual(new Set(["h-full", "notranslate", result.colorScheme]));
  });

  it.each(["light", "dark"])("keeps the saved %s theme over the browser preference", (theme) => {
    expect(initializeTheme(theme, theme === "light").colorScheme).toBe(theme);
  });

  it("resolves the system preference stored by next-themes", () => {
    expect(initializeTheme("system", true).colorScheme).toBe("dark");
  });

  it("still uses the browser preference when storage is blocked", () => {
    expect(initializeTheme(null, true, true).colorScheme).toBe("dark");
  });
});
