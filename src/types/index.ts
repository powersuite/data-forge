export interface List {
  id: string;
  name: string;
  columns: string[];
  row_count: number;
  cleaned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListRow {
  id: string;
  list_id: string;
  row_index: number;
  data: Record<string, string>;
  flags: Record<string, CellFlag>;
  is_duplicate: boolean;
  created_at: string;
}

export type CellFlag =
  | "missing"
  | "cleaned"
  | "split"
  | "formatted"
  | "personal_email"
  | "business_email";

export interface CleanupResult {
  rows: ListRow[];
  newColumns: string[];
  summary: CleanupSummary;
}

export interface CleanupSummary {
  namesSplit: number;
  capsFixed: number;
  phonesFormatted: number;
  emailsClassified: number;
  duplicatesFound: number;
  missingFlagged: number;
}
