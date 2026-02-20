import { ListRow, CellFlag } from "@/types";
import {
  NAME_COLUMN_PATTERNS,
  FIRST_NAME_PATTERNS,
  LAST_NAME_PATTERNS,
  PRESERVE_ACRONYMS,
} from "@/lib/constants";

function isNameColumn(col: string): boolean {
  const patterns = [
    ...NAME_COLUMN_PATTERNS,
    ...FIRST_NAME_PATTERNS,
    ...LAST_NAME_PATTERNS,
  ];
  return patterns.some((p) => p.test(col));
}

function toTitleCase(str: string): string {
  return str
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (PRESERVE_ACRONYMS.has(upper)) return upper;
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function needsFixing(value: string): boolean {
  if (!value || value.length <= 1) return false;
  // All uppercase or all lowercase with multiple characters
  return value === value.toUpperCase() || value === value.toLowerCase();
}

export function standardizeCaps(
  rows: ListRow[],
  columns: string[]
): { rows: ListRow[]; count: number } {
  const nameCols = columns.filter(isNameColumn);
  if (nameCols.length === 0) return { rows, count: 0 };

  let count = 0;

  const newRows = rows.map((row) => {
    let changed = false;
    const newData = { ...row.data };
    const newFlags = { ...row.flags };

    for (const col of nameCols) {
      const val = newData[col];
      if (val && needsFixing(val)) {
        newData[col] = toTitleCase(val);
        newFlags[col] = "cleaned" as CellFlag;
        changed = true;
      }
    }

    if (changed) {
      count++;
      return { ...row, data: newData, flags: newFlags };
    }
    return row;
  });

  return { rows: newRows, count };
}
