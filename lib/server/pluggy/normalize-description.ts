const FULL_DATES = [/\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g];
const MONTH_DATE = /\b\d{1,2}[-/]?(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)(?:[-/]?\d{2,4})?\b/g;
const INSTALLMENT = /\bPARC(?:ELA)?\.?\s*\d{1,3}(?:\s*(?:\/|DE)\s*\d{1,3})?\b/g;
/** Covers both a bare installment (3/5) and a day and month (15/03). */
const NUMBER_PAIR = /\b\d{1,2}\s*\/\s*\d{1,2}\b/g;
/** Six or more digits, including formatted documents such as 12.345.678/0001-90. */
/** Banks truncate long names and glue the marker to the last letter, as in `LOJA CENTRA01/06`, where no word boundary exists. */
const GLUED_INSTALLMENT = /(?<=\p{L})\d{2}\/\d{2}$/u;
const LONG_NUMBER = /\d(?:[.\-/]?\d){5,}/g;
const LONE_PUNCTUATION = /(^|\s)[^\p{L}\p{N}]+(?=\s|$)/gu;

function baseText(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/\s+/g, " ").trim();
}

function collapse(value: string) {
  return value.replace(LONE_PUNCTUATION, " ").replace(/\s+/g, " ").trim();
}

/** Pure, so grouping of card installments can share it. A description made only of removable parts is kept. */
export function normalizeDescription(description: string) {
  const base = baseText(description);
  const stripped = [GLUED_INSTALLMENT, ...FULL_DATES, MONTH_DATE, INSTALLMENT, NUMBER_PAIR, LONG_NUMBER]
    .reduce((text, pattern) => text.replace(pattern, " "), base);
  return collapse(stripped) || base;
}
