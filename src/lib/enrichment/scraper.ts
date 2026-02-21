import * as cheerio from "cheerio";

const TIMEOUT_MS = 10_000;
const MAX_SUB_PAGES = 3;
const MAX_TEXT_LENGTH = 8000;

const SUB_PAGE_PATTERNS = [
  /about/i,
  /team/i,
  /contact/i,
  /staff/i,
  /people/i,
  /leadership/i,
  /our-team/i,
  /management/i,
];

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DataForge/1.0; +https://dataforge.app)",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript, iframe").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

function extractSubPageLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    try {
      const resolved = new URL(href, baseUrl);
      // Only same-origin links
      if (resolved.origin !== new URL(baseUrl).origin) return;
      const path = resolved.pathname.toLowerCase();
      if (SUB_PAGE_PATTERNS.some((p) => p.test(path)) && !seen.has(resolved.href)) {
        seen.add(resolved.href);
        links.push(resolved.href);
      }
    } catch {
      // Invalid URL, skip
    }
  });

  return links.slice(0, MAX_SUB_PAGES);
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = "https://" + normalized;
  }
  return normalized;
}

export async function scrapeWebsite(
  url: string
): Promise<{ text: string; error?: string }> {
  const normalizedUrl = normalizeUrl(url);

  const homepageHtml = await fetchPage(normalizedUrl);
  if (!homepageHtml) {
    return { text: "", error: `Failed to fetch ${normalizedUrl}` };
  }

  const texts: string[] = [htmlToText(homepageHtml)];

  // Find and fetch sub-pages
  const subPageLinks = extractSubPageLinks(homepageHtml, normalizedUrl);
  for (const link of subPageLinks) {
    const subHtml = await fetchPage(link);
    if (subHtml) {
      texts.push(htmlToText(subHtml));
    }
  }

  const combined = texts.join("\n\n");
  const truncated = combined.slice(0, MAX_TEXT_LENGTH);

  return { text: truncated };
}
