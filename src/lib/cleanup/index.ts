import { ListRow, CleanupResult, CleanupSummary } from "@/types";
import { splitNames } from "./split-names";
import { standardizeCaps } from "./standardize-caps";
import { cleanPhones } from "./clean-phones";
import { detectEmailType } from "./detect-email-type";
import { removeDuplicates } from "./remove-duplicates";
import { flagMissing } from "./flag-missing";

export function runCleanup(
  rows: ListRow[],
  columns: string[]
): CleanupResult {
  // 1. Split names
  const nameResult = splitNames(rows, columns);
  let currentRows = nameResult.rows;
  let currentColumns = nameResult.columns;

  // 2. Standardize caps
  const capsResult = standardizeCaps(currentRows, currentColumns);
  currentRows = capsResult.rows;

  // 3. Clean phones
  const phoneResult = cleanPhones(currentRows, currentColumns);
  currentRows = phoneResult.rows;

  // 4. Detect email type
  const emailResult = detectEmailType(currentRows, currentColumns);
  currentRows = emailResult.rows;
  currentColumns = emailResult.columns;

  // 5. Remove duplicates
  const dedupResult = removeDuplicates(currentRows, currentColumns);
  currentRows = dedupResult.rows;

  // 6. Flag missing
  const missingResult = flagMissing(currentRows, currentColumns);
  currentRows = missingResult.rows;

  const summary: CleanupSummary = {
    namesSplit: nameResult.count,
    capsFixed: capsResult.count,
    phonesFormatted: phoneResult.count,
    emailsClassified: emailResult.count,
    duplicatesFound: dedupResult.count,
    missingFlagged: missingResult.count,
  };

  return { rows: currentRows, newColumns: currentColumns, summary };
}
