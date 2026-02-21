import { ListRow, EnrichmentProgress, EnrichmentSummary, EnrichmentLogEntry } from "@/types";
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
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${url} returned ${res.status}: ${text}`);
  }
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

interface SaveEmailResponse {
  success: boolean;
  error?: string;
}

/** Build a short label like "Row 3 – Joe's Pizza" for log readability */
function rowLabel(plan: { rowId: string; existingData: Record<string, string> }, index: number): string {
  const vals = Object.values(plan.existingData).filter(Boolean);
  const hint = vals[0] ? ` – ${vals[0].slice(0, 30)}` : "";
  return `Row ${index + 1}${hint}`;
}

export async function runEnrichment(
  rows: ListRow[],
  columns: string[],
  listId: string,
  onProgress: (progress: EnrichmentProgress) => void
): Promise<EnrichmentSummary> {
  const log: EnrichmentLogEntry[] = [];
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
    log,
  };

  function addLog(entry: Omit<EnrichmentLogEntry, "timestamp">) {
    log.push({ ...entry, timestamp: new Date().toISOString() });
  }

  // Resolve actual column names from the dataset
  const resolved = resolveColumns(columns);
  const columnNames = {
    firstNameCol: resolved.firstNameCol,
    lastNameCol: resolved.lastNameCol,
    emailCol: resolved.emailCol ?? "email",
  };

  addLog({
    rowId: "",
    rowLabel: "System",
    action: "resolve_columns",
    result: "success",
    detail: `Resolved columns: firstName="${columnNames.firstNameCol}", lastName="${columnNames.lastNameCol}", email="${columnNames.emailCol}", website="${resolved.websiteCol ?? "(none)"}"`,
  });

  // Phase 1: Analyze needs
  onProgress({ step: "Analyzing rows...", current: 0, total: rows.length, errors: 0 });
  const plans = analyzeEnrichmentNeeds(rows, columns, resolved);
  const activePlans = plans.filter((p) => p.need !== "skip");
  const skippedPlans = plans.filter((p) => p.need === "skip");

  // Build row index lookup for labels
  const rowIndexMap = new Map<string, number>();
  rows.forEach((r, i) => rowIndexMap.set(r.id, i));

  addLog({
    rowId: "",
    rowLabel: "System",
    action: "analyze_needs",
    result: "success",
    detail: `${activePlans.length} rows need enrichment, ${skippedPlans.length} skipped. Breakdown: ${activePlans.filter(p => p.need === "scrape_and_find").length} scrape, ${activePlans.filter(p => p.need === "find_email").length} find_email, ${activePlans.filter(p => p.need === "verify_only").length} verify_only`,
  });

  if (activePlans.length === 0) {
    addLog({
      rowId: "",
      rowLabel: "System",
      action: "complete",
      result: "skip",
      detail: "No rows need enrichment",
    });
    return summary;
  }

  // Count total steps across all phases for progress tracking
  const scrapeNeeds = activePlans.filter((p) => p.need === "scrape_and_find");
  // emailNeeds and verifyNeeds are dynamic, so use activePlans.length as rough total
  const totalSteps = activePlans.length;
  let completedSteps = 0;

  // Phase 2: Scrape websites + extract contacts
  for (const plan of scrapeNeeds) {
    completedSteps++;
    const label = rowLabel(plan, rowIndexMap.get(plan.rowId) ?? 0);
    onProgress({
      step: `Scraping websites... (${completedSteps}/${totalSteps})`,
      current: completedSteps,
      total: totalSteps,
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
        addLog({
          rowId: plan.rowId,
          rowLabel: label,
          action: "scrape",
          result: "success",
          detail: `Extracted: ${result.contact.first_name ?? ""} ${result.contact.last_name ?? ""} (${result.contact.title ?? "no title"})`,
        });
      } else {
        summary.errors++;
        addLog({
          rowId: plan.rowId,
          rowLabel: label,
          action: "scrape",
          result: "error",
          detail: result.error ?? "No contact found",
        });
      }
    } catch (err) {
      summary.errors++;
      addLog({
        rowId: plan.rowId,
        rowLabel: label,
        action: "scrape",
        result: "error",
        detail: err instanceof Error ? err.message : "Scrape request failed",
      });
    }

    await delay(API_DELAY_MS);
  }

  // Phase 3: Find emails via Icypeas
  const emailNeeds = activePlans.filter(
    (p) => (p.need === "scrape_and_find" || p.need === "find_email") && p.firstName && p.lastName && p.domain
  );
  for (const plan of emailNeeds) {
    completedSteps++;
    const label = rowLabel(plan, rowIndexMap.get(plan.rowId) ?? 0);
    onProgress({
      step: `Finding emails... (${completedSteps}/${totalSteps})`,
      current: Math.min(completedSteps, totalSteps),
      total: totalSteps,
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
        addLog({
          rowId: plan.rowId,
          rowLabel: label,
          action: "find_email",
          result: "success",
          detail: `Found email: ${result.email}`,
        });
      } else {
        // Fall back to pattern generation
        plan.need = "generate_patterns";
        addLog({
          rowId: plan.rowId,
          rowLabel: label,
          action: "find_email",
          result: "error",
          detail: `Icypeas: ${result.error ?? "no email found"} — will generate patterns`,
        });
      }
    } catch (err) {
      plan.need = "generate_patterns";
      summary.errors++;
      addLog({
        rowId: plan.rowId,
        rowLabel: label,
        action: "find_email",
        result: "error",
        detail: err instanceof Error ? err.message : "Email finder request failed",
      });
    }

    await delay(API_DELAY_MS);
  }

  // Phase 4: Generate email patterns for rows where Icypeas didn't find one
  const patternNeeds = activePlans.filter(
    (p) => p.need === "generate_patterns" && p.firstName && p.lastName && p.domain
  );
  for (const plan of patternNeeds) {
    const label = rowLabel(plan, rowIndexMap.get(plan.rowId) ?? 0);
    const patterns = generateEmailPatterns(plan.firstName!, plan.lastName!, plan.domain!);
    if (patterns.length > 0) {
      summary.patternsGenerated++;
      plan.email = patterns[0];

      // BUG FIX: Save generated pattern email to Supabase
      try {
        const result = await callApi<SaveEmailResponse>("/api/enrich/find-email", {
          rowId: plan.rowId,
          firstName: plan.firstName,
          lastName: plan.lastName,
          domain: plan.domain,
          columnNames,
          generatedEmail: patterns[0],  // Signal to save this directly
        });

        if (!result.success) {
          addLog({
            rowId: plan.rowId,
            rowLabel: label,
            action: "generate_pattern",
            result: "error",
            detail: `Generated ${patterns[0]} but failed to save: ${result.error ?? "unknown"}`,
          });
        } else {
          addLog({
            rowId: plan.rowId,
            rowLabel: label,
            action: "generate_pattern",
            result: "success",
            detail: `Saved pattern email: ${patterns[0]}`,
          });
        }
      } catch (err) {
        addLog({
          rowId: plan.rowId,
          rowLabel: label,
          action: "generate_pattern",
          result: "error",
          detail: `Generated ${patterns[0]} but save failed: ${err instanceof Error ? err.message : "unknown"}`,
        });
      }
    } else {
      addLog({
        rowId: plan.rowId,
        rowLabel: label,
        action: "generate_pattern",
        result: "error",
        detail: "Could not generate patterns (missing name/domain)",
      });
    }
  }

  // Phase 5: Verify emails
  const verifyNeeds = activePlans.filter(
    (p) => p.email
  );
  for (const plan of verifyNeeds) {
    completedSteps++;
    const label = rowLabel(plan, rowIndexMap.get(plan.rowId) ?? 0);
    onProgress({
      step: `Verifying emails... (${completedSteps}/${totalSteps})`,
      current: Math.min(completedSteps, totalSteps),
      total: totalSteps,
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
        addLog({
          rowId: plan.rowId,
          rowLabel: label,
          action: "verify_email",
          result: "success",
          detail: `${plan.email} → ${result.status}${result.isRoleAccount ? " (role account)" : ""}`,
        });
      } else {
        summary.errors++;
        addLog({
          rowId: plan.rowId,
          rowLabel: label,
          action: "verify_email",
          result: "error",
          detail: result.error ?? "Verification failed",
        });
      }
    } catch (err) {
      summary.errors++;
      addLog({
        rowId: plan.rowId,
        rowLabel: label,
        action: "verify_email",
        result: "error",
        detail: err instanceof Error ? err.message : "Verify request failed",
      });
    }

    await delay(API_DELAY_MS);
  }

  addLog({
    rowId: "",
    rowLabel: "System",
    action: "complete",
    result: summary.errors > 0 ? "error" : "success",
    detail: `Done. ${summary.contactsExtracted} contacts, ${summary.emailsFound} emails found, ${summary.patternsGenerated} patterns, ${summary.emailsVerified} verified, ${summary.errors} errors`,
  });

  return summary;
}
