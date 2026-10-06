// Small CSV reader for asserting logical rows, including quoted line breaks.
export function parseReportCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = csv.replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index++) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') { cell += '"'; index++; }
      else quoted = !quoted;
    } else if (!quoted && (character === ";" || character === "\n")) {
      row.push(cell);
      cell = "";
      if (character === "\n") { rows.push(row); row = []; }
    } else if (quoted || character !== "\r") cell += character;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows;
}

export function csvCents(value: string) {
  const [whole, fraction] = value.replace("-", "").split(",");
  return (Number(whole) * 100 + Number(fraction)) * (value.startsWith("-") ? -1 : 1);
}
