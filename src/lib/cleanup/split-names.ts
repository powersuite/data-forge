import { ListRow, CellFlag } from "@/types";
import { NAME_COLUMN_PATTERNS, FIRST_NAME_PATTERNS, LAST_NAME_PATTERNS } from "@/lib/constants";

function matchesPatterns(col: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(col));
}

export function splitNames(
  rows: ListRow[],
  columns: string[]
): { rows: ListRow[]; columns: string[]; count: number } {
  // Find "name" columns that need splitting
  const nameCol = columns.find((c) => matchesPatterns(c, NAME_COLUMN_PATTERNS));
  if (!nameCol) return { rows, columns, count: 0 };

  // If first_name/last_name already exist, skip
  const hasFirst = columns.some((c) => matchesPatterns(c, FIRST_NAME_PATTERNS));
  const hasLast = columns.some((c) => matchesPatterns(c, LAST_NAME_PATTERNS));
  if (hasFirst && hasLast) return { rows, columns, count: 0 };

  const firstCol = "first_name";
  const lastCol = "last_name";
  let count = 0;

  const newRows = rows.map((row) => {
    const fullName = (row.data[nameCol] ?? "").trim();
    if (!fullName) return row;

    const parts = fullName.split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ");

    count++;
    return {
      ...row,
      data: { ...row.data, [firstCol]: firstName, [lastCol]: lastName },
      flags: {
        ...row.flags,
        [firstCol]: "split" as CellFlag,
        [lastCol]: "split" as CellFlag,
      },
    };
  });

  // Add new columns after the name column
  const idx = columns.indexOf(nameCol);
  const newColumns = [...columns];
  newColumns.splice(idx + 1, 0, firstCol, lastCol);

  return { rows: newRows, columns: newColumns, count };
}
