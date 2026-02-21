import { ROLE_ACCOUNT_PREFIXES } from "@/lib/constants";

const MV_BASE_URL = "https://api.millionverifier.com/api/v3";

export interface VerifyResult {
  status: "valid" | "invalid" | "risky" | "unknown";
  isRoleAccount: boolean;
}

export async function verifyEmail(email: string): Promise<VerifyResult & { error?: string }> {
  const apiKey = process.env.MILLIONVERIFIER_API_KEY;

  if (!apiKey) {
    return { status: "unknown", isRoleAccount: false, error: "MillionVerifier API key not configured" };
  }

  // Check role account
  const localPart = email.split("@")[0]?.toLowerCase() ?? "";
  const isRoleAccount = ROLE_ACCOUNT_PREFIXES.has(localPart);

  try {
    const res = await fetch(
      `${MV_BASE_URL}/?api=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(email)}`,
      { method: "GET" }
    );

    if (!res.ok) {
      return { status: "unknown", isRoleAccount, error: `MillionVerifier API error: ${res.status}` };
    }

    const data = await res.json();

    // MillionVerifier returns result/resultcode
    let status: VerifyResult["status"] = "unknown";
    const result = (data.result ?? data.quality ?? "").toLowerCase();

    if (result === "ok" || result === "valid" || result === "good") {
      status = "valid";
    } else if (result === "invalid" || result === "bad" || result === "error") {
      status = "invalid";
    } else if (result === "risky" || result === "catch_all" || result === "disposable") {
      status = "risky";
    } else {
      status = "unknown";
    }

    return { status, isRoleAccount };
  } catch (err) {
    return {
      status: "unknown",
      isRoleAccount,
      error: err instanceof Error ? err.message : "MillionVerifier request failed",
    };
  }
}
