import { ListRow, CellFlag } from "@/types";
import { PHONE_COLUMN_PATTERNS } from "@/lib/constants";

function isPhoneColumn(col: string): boolean {
  return PHONE_COLUMN_PATTERNS.some((p) => p.test(col));
}

function formatPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // Handle 10-digit US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // Handle 11-digit with leading 1
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return null; // Can't format
}

export function cleanPhones(
  rows: ListRow[],
  columns: string[]
): { rows: ListRow[]; count: number } {
  const phoneCols = columns.filter(isPhoneColumn);
  if (phoneCols.length === 0) return { rows, count: 0 };

  let count = 0;

  const newRows = rows.map((row) => {
    let changed = false;
    const newData = { ...row.data };
    const newFlags = { ...row.flags };

    for (const col of phoneCols) {
      const val = newData[col];
      if (!val) continue;
      const formatted = formatPhone(val);
      if (formatted && formatted !== val) {
        newData[col] = formatted;
        newFlags[col] = "formatted" as CellFlag;
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
