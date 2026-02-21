export interface List {
  id: string;
  name: string;
  columns: string[];
  row_count: number;
  cleaned: boolean;
  enriched: boolean;
  enrichment_summary: EnrichmentSummary | null;
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
  | "business_email"
  | "enriched"
  | "needs_enrichment"
  | "valid"
  | "invalid"
  | "risky"
  | "unknown"
  | "role_account";

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

export interface EnrichmentProgress {
  step: string;
  current: number;
  total: number;
  errors: number;
}

export interface EnrichmentLogEntry {
  timestamp: string;
  rowId: string;
  rowLabel: string;       // e.g. "Row 3 – Joe's Pizza"
  action: string;         // e.g. "scrape", "find_email", "verify_email", "generate_pattern"
  result: "success" | "error" | "skip";
  detail: string;         // human-readable description of what happened
}

export interface EnrichmentSummary {
  contactsExtracted: number;
  emailsFound: number;
  emailsVerified: number;
  validEmails: number;
  invalidEmails: number;
  riskyEmails: number;
  unknownEmails: number;
  roleAccounts: number;
  patternsGenerated: number;
  errors: number;
  log: EnrichmentLogEntry[];
}

export interface ScrapeResult {
  first_name?: string;
  last_name?: string;
  title?: string;
  confidence?: number;
  error?: string;
}

export interface EmailFinderResult {
  email?: string;
  error?: string;
}

export interface EmailVerifyResult {
  status: "valid" | "invalid" | "risky" | "unknown";
  isRoleAccount: boolean;
  error?: string;
}
