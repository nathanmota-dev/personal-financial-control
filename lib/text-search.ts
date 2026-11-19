/** Case and accents are ignored, so "acai" finds "AÇAÍ". */
function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
}

export function matchesTextSearch(text: string, search: string | undefined) {
  return !search || fold(text).includes(fold(search));
}
