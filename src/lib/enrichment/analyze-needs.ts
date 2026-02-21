import { ListRow, CellFlag } from "@/types";
import {
  WEBSITE_COLUMN_PATTERNS,
  EMAIL_COLUMN_PATTERNS,
  FIRST_NAME_PATTERNS,
  LAST_NAME_PATTERNS,
  FREE_EMAIL_DOMAINS,
} from "@/lib/constants";

export type EnrichmentNeed =
  | "scrape_and_find"   // Has website, needs contact + email
  | "find_email"        // Has name + domain, needs email lookup
  | "verify_only"       // Has business email, just verify
  | "generate_patterns" // Has name + domain, Icypeas failed — guess patterns
  | "skip";             // Already enriched or nothing to work with

export interface RowEnrichmentPlan {
  rowId: string;
  need: EnrichmentNeed;
  websiteUrl?: string;
  firstName?: string;
  lastName?: string;
  domain?: string;
  email?: string;
  existingData: Record<string, string>;
}

function findColumn(columns: string[], patterns: RegExp[]): string | undefined {
  return columns.find((col) => patterns.some((p) => p.test(col)));
}

function getDomain(email: string): string | null {
  const parts = email.split("@");
  if (parts.length !== 2) return null;
  return parts[1].toLowerCase();
}

function getDomainFromUrl(url: string): string | null {
  try {
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = "https://" + normalized;
    }
    return new URL(normalized).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function analyzeEnrichmentNeeds(
  rows: ListRow[],
  columns: string[]
): RowEnrichmentPlan[] {
  const websiteCol = findColumn(columns, WEBSITE_COLUMN_PATTERNS);
  const emailCol = findColumn(columns, EMAIL_COLUMN_PATTERNS);
  const firstNameCol = findColumn(columns, FIRST_NAME_PATTERNS) ?? "First Name";
  const lastNameCol = findColumn(columns, LAST_NAME_PATTERNS) ?? "Last Name";

  return rows.map((row) => {
    const data = row.data;
    const flags = row.flags;

    // Already enriched? Skip.
    const hasEnrichedFlag = Object.values(flags).some(
      (f: CellFlag) => f === "enriched" || f === "valid" || f === "invalid" || f === "risky" || f === "role_account"
    );
    if (hasEnrichedFlag) {
      return { rowId: row.id, need: "skip", existingData: data };
    }

    // Skip duplicates
    if (row.is_duplicate) {
      return { rowId: row.id, need: "skip", existingData: data };
    }

    const email = emailCol ? (data[emailCol] ?? "").trim() : "";
    const website = websiteCol ? (data[websiteCol] ?? "").trim() : "";
    const firstName = (data[firstNameCol] ?? "").trim();
    const lastName = (data[lastNameCol] ?? "").trim();

    const emailDomain = email ? getDomain(email) : null;
    const isBusinessEmail = emailDomain ? !FREE_EMAIL_DOMAINS.has(emailDomain) : false;
    const websiteDomain = website ? getDomainFromUrl(website) : null;
    const domain = isBusinessEmail ? emailDomain : websiteDomain;

    // Has business email → just verify
    if (email && isBusinessEmail) {
      return {
        rowId: row.id,
        need: "verify_only",
        email,
        existingData: data,
      };
    }

    // Has website but no business email → scrape for contact + find email
    if (website && !isBusinessEmail) {
      return {
        rowId: row.id,
        need: "scrape_and_find",
        websiteUrl: website,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        domain: domain ?? undefined,
        existingData: data,
      };
    }

    // Has name + domain but no email → try email lookup
    if (firstName && lastName && domain) {
      return {
        rowId: row.id,
        need: "find_email",
        firstName,
        lastName,
        domain,
        existingData: data,
      };
    }

    return { rowId: row.id, need: "skip", existingData: data };
  });
}
