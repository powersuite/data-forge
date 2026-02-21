import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface ExtractedContact {
  first_name?: string;
  last_name?: string;
  title?: string;
  confidence?: number;
}

export async function extractContactWithClaude(
  websiteText: string,
  existingData: Record<string, string>
): Promise<ExtractedContact> {
  const existingContext = Object.entries(existingData)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are extracting the key decision-maker contact from a business website.

Existing row data: ${existingContext || "none"}

Website text:
${websiteText}

Find the most relevant decision-maker. Priority order: Owner > Founder > President > General Manager > Director > Head Pro > Manager.

Respond ONLY with valid JSON (no markdown, no explanation):
{"first_name": "...", "last_name": "...", "title": "...", "confidence": 0.0-1.0}

If no contact can be identified, respond with:
{"confidence": 0}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    return {
      first_name: parsed.first_name || undefined,
      last_name: parsed.last_name || undefined,
      title: parsed.title || undefined,
      confidence: parsed.confidence ?? 0,
    };
  } catch {
    return { confidence: 0 };
  }
}
