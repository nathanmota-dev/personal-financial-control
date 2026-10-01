// next/script runs this before hydration so the first paint uses the saved theme
// or the browser preference, even when localStorage is unavailable.
export const themeInitializationScript = `
(() => {
  let theme;
  try {
    theme = localStorage.getItem("theme");
  } catch {}
  const dark = theme === "dark" ||
    (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(dark ? "dark" : "light");
  root.style.colorScheme = dark ? "dark" : "light";
})();
`;
