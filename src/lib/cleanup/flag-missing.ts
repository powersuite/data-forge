import { ListRow, CellFlag } from "@/types";

export function flagMissing(
  rows: ListRow[],
  columns: string[]
): { rows: ListRow[]; count: number } {
  let count = 0;

  const newRows = rows.map((row) => {
    let changed = false;
    const newFlags = { ...row.flags };

    for (const col of columns) {
      const val = row.data[col];
      if (val === undefined || val === null || val.trim() === "") {
        // Don't overwrite existing flags
        if (!newFlags[col]) {
          newFlags[col] = "missing" as CellFlag;
          changed = true;
        }
      }
    }

    if (changed) {
      count++;
      return { ...row, flags: newFlags };
    }
    return row;
  });

  return { rows: newRows, count };
}
