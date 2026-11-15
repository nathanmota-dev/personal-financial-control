/** Up to two initials (first and last word) for avatar fallbacks. */
export function getUserInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = Array.from(words[0] ?? "")[0] ?? "U";
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? "" : "";
  return `${first}${last}`.toLocaleUpperCase("pt-BR");
}
