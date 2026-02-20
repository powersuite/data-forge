import { ListRow, CellFlag } from "@/types";
import { EMAIL_COLUMN_PATTERNS, FREE_EMAIL_DOMAINS } from "@/lib/constants";

function isEmailColumn(col: string): boolean {
  return EMAIL_COLUMN_PATTERNS.some((p) => p.test(col));
}

export function detectEmailType(
  rows: ListRow[],
  columns: string[]
): { rows: ListRow[]; columns: string[]; count: number } {
  const emailCol = columns.find(isEmailColumn);
  if (!emailCol) return { rows, columns, count: 0 };

  const typeCol = "email_type";
  let count = 0;

  const newRows = rows.map((row) => {
    const email = (row.data[emailCol] ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) return row;

    const domain = email.split("@")[1];
    const isPersonal = FREE_EMAIL_DOMAINS.has(domain);
    count++;

    return {
      ...row,
      data: { ...row.data, [typeCol]: isPersonal ? "personal" : "business" },
      flags: {
        ...row.flags,
        [typeCol]: (isPersonal ? "personal_email" : "business_email") as CellFlag,
      },
    };
  });

  const newColumns = columns.includes(typeCol)
    ? columns
    : [...columns, typeCol];

  return { rows: newRows, columns: newColumns, count };
}
