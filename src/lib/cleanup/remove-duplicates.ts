import { ListRow } from "@/types";
import { EMAIL_COLUMN_PATTERNS, PHONE_COLUMN_PATTERNS } from "@/lib/constants";

function findCol(columns: string[], patterns: RegExp[]): string | undefined {
  return columns.find((c) => patterns.some((p) => p.test(c)));
}

export function removeDuplicates(
  rows: ListRow[],
  columns: string[]
): { rows: ListRow[]; count: number } {
  const emailCol = findCol(columns, EMAIL_COLUMN_PATTERNS);
  const phoneCol = findCol(columns, PHONE_COLUMN_PATTERNS);

  if (!emailCol && !phoneCol) return { rows, count: 0 };

  const seen = new Set<string>();
  let count = 0;

  const newRows = rows.map((row) => {
    const emailVal = emailCol
      ? (row.data[emailCol] ?? "").trim().toLowerCase()
      : "";
    const phoneVal = phoneCol
      ? (row.data[phoneCol] ?? "").replace(/\D/g, "")
      : "";
    const key = `${emailVal}||${phoneVal}`;

    if (!key || key === "||") return row;

    if (seen.has(key)) {
      count++;
      return { ...row, is_duplicate: true };
    }
    seen.add(key);
    return row;
  });

  return { rows: newRows, count };
}
