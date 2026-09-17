/** Minimal client-side CSV export — escapes quotes/commas/newlines per RFC 4180. */
function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  // Leading BOM so Excel opens UTF-8 (Arabic names/addresses) correctly.
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
