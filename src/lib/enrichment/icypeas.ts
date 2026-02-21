const ICYPEAS_BASE_URL = "https://app.icypeas.com/api";

export async function findEmail(
  firstName: string,
  lastName: string,
  domain: string
): Promise<{ email?: string; error?: string }> {
  const apiKey = process.env.ICYPEAS_API_KEY;
  const apiSecret = process.env.ICYPEAS_API_SECRET;

  if (!apiKey || !apiSecret) {
    return { error: "Icypeas API credentials not configured" };
  }

  try {
    const res = await fetch(`${ICYPEAS_BASE_URL}/email-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        firstname: firstName,
        lastname: lastName,
        domainOrCompany: domain,
      }),
    });

    if (!res.ok) {
      return { error: `Icypeas API error: ${res.status}` };
    }

    const data = await res.json();

    if (data.email) {
      return { email: data.email };
    }

    // Icypeas may return results in different formats
    if (data.emails && data.emails.length > 0) {
      return { email: data.emails[0] };
    }

    return { error: "No email found" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Icypeas request failed" };
  }
}
