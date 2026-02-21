import { ListRow, EnrichmentProgress, EnrichmentSummary } from "@/types";
import { analyzeEnrichmentNeeds, resolveColumns } from "./analyze-needs";
import { generateEmailPatterns } from "./generate-email-patterns";

const API_DELAY_MS = 200;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function callApi<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

interface ScrapeResponse {
  success: boolean;
  contact?: { first_name?: string; last_name?: string; title?: string };
  error?: string;
}

interface FindEmailResponse {
  success: boolean;
  email?: string;
  error?: string;
}

interface VerifyResponse {
  success: boolean;
  status?: "valid" | "invalid" | "risky" | "unknown";
  isRoleAccount?: boolean;
  error?: string;
}

export async function runEnrichment(
  rows: ListRow[],
  columns: string[],
  listId: string,
  onProgress: (progress: EnrichmentProgress) => void
): Promise<EnrichmentSummary> {
  const summary: EnrichmentSummary = {
    contactsExtracted: 0,
    emailsFound: 0,
    emailsVerified: 0,
    validEmails: 0,
    invalidEmails: 0,
    riskyEmails: 0,
    unknownEmails: 0,
    roleAccounts: 0,
    patternsGenerated: 0,
    errors: 0,
  };

  // Resolve actual column names from the dataset
  const resolved = resolveColumns(columns);
  const columnNames = {
    firstNameCol: resolved.firstNameCol,
    lastNameCol: resolved.lastNameCol,
    emailCol: resolved.emailCol ?? "email",
  };

  // Phase 1: Analyze needs
  onProgress({ step: "Analyzing rows...", current: 0, total: rows.length, errors: 0 });
  const plans = analyzeEnrichmentNeeds(rows, columns, resolved);
  const activePlans = plans.filter((p) => p.need !== "skip");
  const total = activePlans.length;

  if (total === 0) {
    return summary;
  }

  let current = 0;

  // Phase 2: Scrape websites + extract contacts
  const scrapeNeeds = activePlans.filter((p) => p.need === "scrape_and_find");
  for (const plan of scrapeNeeds) {
    current++;
    onProgress({
      step: `Scraping websites... (${current}/${total})`,
      current,
      total,
      errors: summary.errors,
    });

    try {
      const result = await callApi<ScrapeResponse>("/api/enrich/scrape", {
        rowId: plan.rowId,
        websiteUrl: plan.websiteUrl,
        existingData: plan.existingData,
        columnNames,
      });

      if (result.success && result.contact) {
        summary.contactsExtracted++;
        // Update plan with extracted name for email finding
        if (result.contact.first_name) plan.firstName = result.contact.first_name;
        if (result.contact.last_name) plan.lastName = result.contact.last_name;
      } else {
        summary.errors++;
      }
    } catch {
      summary.errors++;
    }

    await delay(API_DELAY_MS);
  }

  // Phase 3: Find emails via Icypeas
  const emailNeeds = activePlans.filter(
    (p) => (p.need === "scrape_and_find" || p.need === "find_email") && p.firstName && p.lastName && p.domain
  );
  for (const plan of emailNeeds) {
    current++;
    onProgress({
      step: `Finding emails... (${current}/${total})`,
      current,
      total,
      errors: summary.errors,
    });

    try {
      const result = await callApi<FindEmailResponse>("/api/enrich/find-email", {
        rowId: plan.rowId,
        firstName: plan.firstName,
        lastName: plan.lastName,
        domain: plan.domain,
        columnNames,
      });

      if (result.success && result.email) {
        summary.emailsFound++;
        plan.email = result.email;
      } else {
        // Fall back to pattern generation
        plan.need = "generate_patterns";
      }
    } catch {
      plan.need = "generate_patterns";
      summary.errors++;
    }

    await delay(API_DELAY_MS);
  }

  // Phase 4: Generate email patterns for rows where Icypeas didn't find one
  const patternNeeds = activePlans.filter(
    (p) => p.need === "generate_patterns" && p.firstName && p.lastName && p.domain
  );
  for (const plan of patternNeeds) {
    const patterns = generateEmailPatterns(plan.firstName!, plan.lastName!, plan.domain!);
    if (patterns.length > 0) {
      summary.patternsGenerated++;
      // Store first pattern as best guess (can be verified later)
      plan.email = patterns[0];
    }
  }

  // Phase 5: Verify emails
  const verifyNeeds = activePlans.filter(
    (p) => (p.need === "verify_only" && p.email) || p.email
  );
  for (const plan of verifyNeeds) {
    current++;
    onProgress({
      step: `Verifying emails... (${current}/${total})`,
      current,
      total,
      errors: summary.errors,
    });

    try {
      const result = await callApi<VerifyResponse>("/api/enrich/verify-email", {
        rowId: plan.rowId,
        email: plan.email,
        columnNames,
      });

      if (result.success) {
        summary.emailsVerified++;
        switch (result.status) {
          case "valid":
            summary.validEmails++;
            break;
          case "invalid":
            summary.invalidEmails++;
            break;
          case "risky":
            summary.riskyEmails++;
            break;
          default:
            summary.unknownEmails++;
        }
        if (result.isRoleAccount) {
          summary.roleAccounts++;
        }
      } else {
        summary.errors++;
      }
    } catch {
      summary.errors++;
    }

    await delay(API_DELAY_MS);
  }

  return summary;
}
