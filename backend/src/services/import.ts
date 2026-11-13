export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else quoted = false;
      } else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const useful = rows.filter((record) => record.some((value) => value.trim()));
  const header = useful.shift();
  if (!header) return [];
  const keys = header.map((key) => key.trim());
  return useful.map((record, index) => ({
    line: index + 2,
    values: Object.fromEntries(keys.map((key, cellIndex) => [key, (record[cellIndex] || "").trim()])),
  }));
}

export function recordsFromImport(format: "csv" | "json", content: string) {
  if (format === "json") {
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) throw Object.assign(new Error("JSON imports must be an array of records."), { status: 400 });
    return parsed.map((item, index) => ({ line: index + 1, values: item as Record<string, string> }));
  }
  return parseCsv(content);
}
